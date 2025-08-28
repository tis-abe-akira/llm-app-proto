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
              const assistantMessage: Message = {
                id: `msg-${Date.now()}`,
                role: 'assistant',
                content: fullResponse,
                timestamp: new Date(),
              };
              setMessages(prev => [...prev, assistantMessage]);
              setStreamingMessage('');
              break;
            } else {
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

  return {
    currentSession,
    messages,
    streamingMessage,
    isLoading,
    isStreaming,
    sendMessage,
    clearCurrentChat,
    startNewSession,
  };
};
