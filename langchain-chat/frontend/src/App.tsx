import React, { useEffect, useRef } from 'react';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { Sidebar } from './components/Sidebar';
import { useChat } from './hooks/useChat';
import { useChatHistory } from './hooks/useChatHistory';
import { Message } from './types/chat';

function App() {
  const {
    currentSession,
    messages,
    streamingMessage,
    isLoading,
    isStreaming,
    sendMessage,
    clearCurrentChat,
    startNewSession,
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

  const handleSelectSession = async (session: any) => {
    // For now, we'll just start a new session since we'd need to implement session loading
    startNewSession();
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
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSession?.id}
        onSelectSession={handleSelectSession}
        onNewChat={startNewSession}
        onDeleteSession={handleDeleteSession}
      />
      
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 p-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold text-gray-800">
              {currentSession?.title || 'LangChain Chat'}
            </h1>
            <button
              onClick={clearCurrentChat}
              className="px-3 py-1 text-sm text-gray-600 hover:text-red-600 transition-colors"
            >
              Clear Chat
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {allMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <h2 className="text-2xl font-semibold mb-2">Welcome to LangChain Chat</h2>
                <p>Start a conversation by typing a message below.</p>
              </div>
            </div>
          ) : (
            <>
              {allMessages.map((message, index) => (
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

export default App
