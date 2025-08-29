/**
 * Chat component - the main chat interface
 */

import { useEffect, useRef } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { Sidebar } from './Sidebar';
import { BotSelector } from './BotSelector';
import { useChat } from '../hooks/useChat';
import { useChatHistory } from '../hooks/useChatHistory';
import type { Message, ChatSession } from '../types/chat';

export function Chat() {
  const {
    currentSession,
    messages,
    streamingMessage,
    isLoading,
    isStreaming,
    selectedBotId,
    sendMessage,
    clearCurrentChat,
    startNewSession,
    loadSession,
    handleBotChange,
  } = useChat();

  const { sessions, saveSession, deleteSession } = useChatHistory();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  useEffect(() => {
    if (currentSession && messages.length > 0) {
      saveSession({
        ...currentSession,
        messages,
        updatedAt: new Date(),
      });
    }
  }, [currentSession, messages, saveSession]);

  const handleSelectSession = (session: ChatSession) => {
    loadSession(session);
  };

  const handleDeleteSession = (sessionId: string) => {
    deleteSession(sessionId);
    if (currentSession?.id === sessionId) {
      startNewSession();
    }
  };

  const allMessages = [...messages];
  if (isStreaming && streamingMessage) {
    const streamingMsg: Message = {
      id: 'streaming',
      role: 'assistant',
      content: streamingMessage,
      timestamp: new Date(),
    };
    allMessages.push(streamingMsg);
  }

  return (
    <div className="flex h-full bg-gray-100">
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSession?.id}
        onSelectSession={handleSelectSession}
        onNewChat={startNewSession}
        onDeleteSession={handleDeleteSession}
      />
      
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 p-4">
          <div className="flex justify-between items-center mb-3">
            <h1 className="text-xl font-semibold text-gray-800">
              {currentSession?.title || 'LangChain RAG Chat'}
            </h1>
            <button
              onClick={clearCurrentChat}
              className="px-3 py-1 text-sm text-gray-600 hover:text-red-600 transition-colors"
            >
              Clear Chat
            </button>
          </div>
          
          {/* Bot Selector */}
          <div className="max-w-xs">
            <BotSelector
              selectedBotId={selectedBotId}
              onBotChange={handleBotChange}
            />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {allMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <h2 className="text-2xl font-semibold mb-2">Welcome to LangChain RAG Chat</h2>
                <p className="mb-4">Choose a RAG bot above or start a regular conversation below.</p>
                <div className="text-sm text-gray-400">
                  💬 Regular chat provides standard AI conversation<br/>
                  🤖 RAG bots use your uploaded documents to provide informed responses
                </div>
              </div>
            </div>
          ) : (
            <>
              {allMessages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isStreaming={message.id === 'streaming'}
                />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <ChatInput onSendMessage={sendMessage} disabled={isLoading} />
      </div>
    </div>
  );
}