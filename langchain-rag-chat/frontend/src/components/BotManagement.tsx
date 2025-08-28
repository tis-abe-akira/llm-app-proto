/**
 * BotManagement page for managing RAG bots
 */

import React, { useState } from 'react';
import { BotList } from './BotList';
import { CreateBot } from './CreateBot';
import { BotDetails } from './BotDetails';
import type { RAGBot } from '../types/ragBot';

export function BotManagement() {
  const [selectedBot, setSelectedBot] = useState<RAGBot | null>(null);
  const [showCreateBot, setShowCreateBot] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSelectBot = (bot: RAGBot) => {
    setSelectedBot(bot);
    setShowCreateBot(false);
  };

  const handleBotCreated = (newBot: RAGBot) => {
    setSelectedBot(newBot);
    setShowCreateBot(false);
    setRefreshKey(prev => prev + 1); // Trigger BotList refresh
  };

  const handleBotUpdated = (updatedBot: RAGBot) => {
    setSelectedBot(updatedBot);
    setRefreshKey(prev => prev + 1); // Trigger BotList refresh
  };

  const handleShowCreateBot = () => {
    setShowCreateBot(true);
    setSelectedBot(null);
  };

  const handleCancelCreate = () => {
    setShowCreateBot(false);
  };

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Left Sidebar - Bot List */}
      <div className="w-1/3 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="border-b border-gray-200 p-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold text-gray-900">RAG Bots</h1>
            <button
              onClick={handleShowCreateBot}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              + New Bot
            </button>
          </div>
        </div>
        
        <BotList
          key={refreshKey} // Force re-render when refreshKey changes
          onSelectBot={handleSelectBot}
          selectedBotId={selectedBot?.id}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        {showCreateBot ? (
          <div className="p-8">
            <CreateBot
              onBotCreated={handleBotCreated}
              onCancel={handleCancelCreate}
            />
          </div>
        ) : selectedBot ? (
          <BotDetails
            bot={selectedBot}
            onBotUpdated={handleBotUpdated}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <div className="text-6xl mb-4">🤖</div>
              <h2 className="text-2xl font-semibold mb-2">RAG Bot Management</h2>
              <p className="text-lg mb-4">Select a bot from the list or create a new one</p>
              <button
                onClick={handleShowCreateBot}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Create Your First Bot
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}