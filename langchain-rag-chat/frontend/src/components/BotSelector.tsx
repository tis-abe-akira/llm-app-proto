/**
 * BotSelector component for choosing RAG bots in chat interface
 */

import React, { useState, useEffect } from 'react';
import type { RAGBot } from '../types/ragBot';
import { ragBotService } from '../services/ragBotService';

interface BotSelectorProps {
  selectedBotId?: string;
  onBotChange: (botId: string | null) => void;
}

export function BotSelector({ selectedBotId, onBotChange }: BotSelectorProps) {
  const [bots, setBots] = useState<RAGBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadBots();
  }, []);

  const loadBots = async () => {
    try {
      setLoading(true);
      const fetchedBots = await ragBotService.listBots();
      setBots(fetchedBots);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bots');
    } finally {
      setLoading(false);
    }
  };

  const selectedBot = bots.find(bot => bot.id === selectedBotId);
  
  console.log('=== BotSelector Render ===');
  console.log('Props selectedBotId:', selectedBotId);
  console.log('Found selectedBot:', selectedBot);
  console.log('Available bots:', bots.map(b => ({ id: b.id, name: b.name })));

  const handleBotSelect = (botId: string | null) => {
    console.log('=== BotSelector: Bot Selected ===');
    console.log('Selected Bot ID:', botId);
    onBotChange(botId);
    setIsOpen(false);
  };

  if (loading) {
    return (
      <div className="relative">
        <div className="flex items-center px-3 py-2 text-sm text-gray-500 bg-gray-50 rounded-lg">
          Loading bots...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative">
        <div className="flex items-center px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg">
          Error loading bots
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <div className="flex items-center space-x-2">
          <span className="text-lg">
            {selectedBot ? '🤖' : '💬'}
          </span>
          <span className="text-gray-700">
            {selectedBot ? selectedBot.name : 'Regular Chat'}
          </span>
        </div>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
          {/* Regular Chat Option */}
          <button
            onClick={() => handleBotSelect(null)}
            className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-2 ${
              !selectedBotId ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
            }`}
          >
            <span className="text-lg">💬</span>
            <div>
              <div className="font-medium">Regular Chat</div>
              <div className="text-xs text-gray-500">Standard conversation without RAG</div>
            </div>
          </button>

          {/* RAG Bots */}
          {bots.length > 0 && (
            <>
              <div className="border-t border-gray-200 mx-2"></div>
              {bots.map((bot) => (
                <button
                  key={bot.id}
                  onClick={() => handleBotSelect(bot.id)}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-2 ${
                    selectedBotId === bot.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
                >
                  <span className="text-lg">🤖</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{bot.name}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {bot.document_count} documents
                      {bot.description && ` • ${bot.description}`}
                    </div>
                  </div>
                </button>
              ))}
            </>
          )}

          {bots.length === 0 && (
            <div className="px-3 py-4 text-center text-gray-500 text-sm">
              <div className="text-lg mb-1">🔍</div>
              <div>No RAG bots available</div>
              <div className="text-xs">Create a bot to get started</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}