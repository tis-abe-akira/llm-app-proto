/**
 * RAG BOT list component for displaying and managing bots
 */

import React, { useState, useEffect } from 'react';
import type { RAGBot } from '../types/ragBot';
import { ragBotService } from '../services/ragBotService';

interface BotListProps {
  onSelectBot: (bot: RAGBot) => void;
  selectedBotId?: string;
}

export function BotList({ onSelectBot, selectedBotId }: BotListProps) {
  const [bots, setBots] = useState<RAGBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    loadBots();
  }, []);

  const handleDeleteBot = async (botId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this bot? This action cannot be undone.')) {
      return;
    }

    try {
      await ragBotService.deleteBot(botId);
      setBots(bots.filter(bot => bot.id !== botId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete bot');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Loading bots...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-600 mr-2">⚠️</div>
            <div className="text-red-700">{error}</div>
          </div>
          <button
            onClick={loadBots}
            className="mt-2 text-sm text-red-600 hover:text-red-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (bots.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <div className="text-gray-500 mb-4">No RAG bots found</div>
          <div className="text-sm text-gray-400">
            Create your first RAG bot to get started
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {bots.map((bot) => (
        <div
          key={bot.id}
          className={`
            border rounded-lg p-4 cursor-pointer transition-all
            ${selectedBotId === bot.id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }
          `}
          onClick={() => onSelectBot(bot)}
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-gray-900">{bot.name}</h3>
            <button
              onClick={(e) => handleDeleteBot(bot.id, e)}
              className="text-red-500 hover:text-red-700 text-sm"
              title="Delete bot"
            >
              ✕
            </button>
          </div>
          
          {bot.description && (
            <p className="text-sm text-gray-600 mb-2">{bot.description}</p>
          )}
          
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>{bot.document_count} documents</span>
            <span>{new Date(bot.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
}