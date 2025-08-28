/**
 * Service for RAG BOT API interactions
 */

import type { RAGBot, CreateBotRequest, BotUploadResult } from '../types/ragBot';

const API_BASE = 'http://localhost:8000';

export class RAGBotService {
  /**
   * Create a new RAG bot
   */
  async createBot(request: CreateBotRequest): Promise<RAGBot> {
    const response = await fetch(`${API_BASE}/bots`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to create bot: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get all RAG bots
   */
  async listBots(): Promise<RAGBot[]> {
    const response = await fetch(`${API_BASE}/bots`);

    if (!response.ok) {
      throw new Error(`Failed to fetch bots: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get a specific RAG bot by ID
   */
  async getBot(botId: string): Promise<RAGBot> {
    const response = await fetch(`${API_BASE}/bots/${botId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch bot: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Delete a RAG bot
   */
  async deleteBot(botId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/bots/${botId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete bot: ${response.statusText}`);
    }
  }

  /**
   * Upload document to a RAG bot
   */
  async uploadDocument(botId: string, file: File): Promise<BotUploadResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/bots/${botId}/documents`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload document: ${response.statusText}`);
    }

    return response.json();
  }
}

export const ragBotService = new RAGBotService();