import { useState, useCallback, useEffect } from 'react';
import type { Message, ChatSession } from '../types/chat';
import { chatService } from '../services/chatService';

export const useChat = () => {
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const generateSessionId = () => {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const startNewSession = useCallback(() => {
    const sessionId = generateSessionId();
    const newSession: ChatSession = {
      id: sessionId,
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setCurrentSession(newSession);
    setMessages([]);
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    let sessionToUse = currentSession;
    if (!sessionToUse) {
      const sessionId = generateSessionId();
      sessionToUse = {
        id: sessionId,
        title: content.slice(0, 30) + (content.length > 30 ? '...' : ''),
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setCurrentSession(sessionToUse);
    }

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };

    // 最初のメッセージの場合、タイトルを自動生成
    if (sessionToUse.messages.length === 0 && sessionToUse.title === 'New Chat') {
      const autoTitle = content.slice(0, 40).trim();
      const finalTitle = autoTitle.length === content.length ? autoTitle : `${autoTitle}...`;
      sessionToUse = { 
        ...sessionToUse, 
        title: finalTitle,
        updatedAt: new Date()
      };
      setCurrentSession(sessionToUse);
    }

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setIsStreaming(true);
    setStreamingMessage('');

    try {
      const { stream, sessionId } = await chatService.sendMessage(content, sessionToUse.id);
      
      if (sessionId !== sessionToUse.id) {
        sessionToUse = { ...sessionToUse, id: sessionId };
        setCurrentSession(sessionToUse);
      }

      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              setIsStreaming(false);
              console.log('=== Streaming Complete ===');
              console.log('Final response:', JSON.stringify(fullResponse));
              console.log('Response has newlines:', fullResponse.includes('\n'));
              
              try {
                // バックエンドから正しいフォーマットのメッセージを取得
                const correctContent = await chatService.getLatestMessage(sessionId);
                console.log('Correct content from backend:', JSON.stringify(correctContent));
                
                const assistantMessage: Message = {
                  id: `msg-${Date.now()}`,
                  role: 'assistant',
                  content: correctContent,
                  timestamp: new Date(),
                };
                setMessages(prev => [...prev, assistantMessage]);
              } catch (error) {
                console.error('Failed to get correct message, using streamed version:', error);
                const assistantMessage: Message = {
                  id: `msg-${Date.now()}`,
                  role: 'assistant',
                  content: fullResponse,
                  timestamp: new Date(),
                };
                setMessages(prev => [...prev, assistantMessage]);
              }
              
              setStreamingMessage('');
              break;
            } else if (data !== '') {
              // 空文字でない限り追加（改行も含めて）
              console.log('Adding streaming data:', JSON.stringify(data));
              fullResponse += data;
              setStreamingMessage(fullResponse);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setIsStreaming(false);
      setStreamingMessage('');
    } finally {
      setIsLoading(false);
    }
  }, [currentSession]);

  const clearCurrentChat = useCallback(async () => {
    if (currentSession) {
      try {
        await chatService.clearChatHistory(currentSession.id);
        setMessages([]);
      } catch (error) {
        console.error('Error clearing chat:', error);
      }
    }
  }, [currentSession]);

  useEffect(() => {
    startNewSession();
  }, [startNewSession]);

  const loadSession = useCallback((session: ChatSession) => {
    setCurrentSession(session);
    setMessages(session.messages);
  }, []);

  return {
    currentSession,
    messages,
    streamingMessage,
    isLoading,
    isStreaming,
    sendMessage,
    clearCurrentChat,
    startNewSession,
    loadSession,
  };
};
