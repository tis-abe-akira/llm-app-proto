import React from 'react';
import type { ChatSession } from '../types/chat';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId?: string;
  onSelectSession: (session: ChatSession) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
}) => {
  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={onNewChat}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          + New Chat
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          <h3 className="text-sm font-medium text-gray-500 mb-2 px-2">Recent Chats</h3>
          {sessions.length === 0 ? (
            <div className="text-sm text-gray-400 px-2">No chat history yet</div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={`group flex items-center justify-between p-2 mb-1 rounded-lg cursor-pointer hover:bg-gray-100 ${
                  session.id === currentSessionId ? 'bg-blue-50 border border-blue-200' : ''
                }`}
                onClick={() => onSelectSession(session)}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {session.title}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDate(session.updatedAt)}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                  title="Delete chat"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
