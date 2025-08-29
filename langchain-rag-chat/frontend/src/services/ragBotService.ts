/**
 * Service for RAG BOT API interactions
 */

import type { RAGBot, CreateBotRequest, BotUploadResult, BotStatus, ProcessingProgress } from '../types/ragBot';

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
   * Get bot status
   */
  async getBotStatus(botId: string): Promise<{status: BotStatus, processing_progress?: ProcessingProgress, error_message?: string}> {
    const response = await fetch(`${API_BASE}/bots/${botId}/status`);
    
    if (!response.ok) {
      throw new Error(`Failed to get bot status: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  /**
   * Wait for bot to be ready
   */
  async waitForBotReady(botId: string, onProgress?: (progress: ProcessingProgress) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      const checkStatus = async () => {
        try {
          const statusInfo = await this.getBotStatus(botId);
          
          if (statusInfo.status === 'ready') {
            resolve();
            return;
          }
          
          if (statusInfo.status === 'error') {
            reject(new Error(statusInfo.error_message || 'Bot processing failed'));
            return;
          }
          
          if (statusInfo.status === 'processing' && statusInfo.processing_progress && onProgress) {
            onProgress(statusInfo.processing_progress);
          }
          
          setTimeout(checkStatus, 1000);
        } catch (error) {
          reject(error);
        }
      };
      
      checkStatus();
    });
  }

  /**
   * Upload document to a RAG bot
   */
  async uploadDocument(botId: string, file: File, onProgress?: (progress: ProcessingProgress) => void): Promise<BotUploadResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/bots/${botId}/documents`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload document: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (onProgress) {
      await this.waitForBotReady(botId, onProgress);
    }
    
    return result;
  }
}

export const ragBotService = new RAGBotService();