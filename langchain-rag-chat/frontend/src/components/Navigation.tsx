/**
 * Navigation component for routing between different views
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export function Navigation() {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1">
          <Link
            to="/chat"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive('/chat')
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            💬 Chat
          </Link>
          <Link
            to="/bots"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive('/bots')
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            🤖 RAG Bots
          </Link>
        </div>
        
        <div className="text-sm text-gray-500">
          LangChain RAG Chat
        </div>
      </div>
    </nav>
  );
}