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
    const isToday = now.toDateString() === date.toDateString();
    const isYesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString() === date.toDateString();
    
    const timeString = date.toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });

    if (isToday) {
      return timeString; // "14:30"
    }
    
    if (isYesterday) {
      return `昨日 ${timeString}`; // "昨日 14:30"
    }
    
    const isSameYear = now.getFullYear() === date.getFullYear();
    if (isSameYear) {
      const dateString = date.toLocaleDateString('ja-JP', { 
        month: 'numeric', 
        day: 'numeric' 
      });
      return `${dateString} ${timeString}`; // "12/25 14:30"
    }
    
    const fullDateString = date.toLocaleDateString('ja-JP', { 
      year: 'numeric',
      month: 'numeric', 
      day: 'numeric' 
    });
    return `${fullDateString} ${timeString}`; // "2024/12/25 14:30"
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
                className={`group flex items-start justify-between p-3 mb-2 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors ${
                  session.id === currentSessionId ? 'bg-blue-50 border border-blue-200' : ''
                }`}
                onClick={() => onSelectSession(session)}
                title={session.title} // ホバーで完全なタイトルを表示
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="text-sm font-semibold text-gray-900 truncate leading-tight">
                    {session.title}
                  </div>
                  <div className="text-xs text-gray-500 font-medium">
                    {formatDate(session.updatedAt)}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-600 transition-all text-sm"
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
