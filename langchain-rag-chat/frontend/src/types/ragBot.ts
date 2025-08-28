/**
 * Type definitions for RAG BOT management
 */

export interface Document {
  filename: string;
  added_at: string;
  chunks: number;
}

export interface RAGBot {
  id: string;
  name: string;
  description: string;
  created_at: string;
  documents: Document[];
  document_count: number;
}

export interface CreateBotRequest {
  name: string;
  description?: string;
}

export interface BotUploadResult {
  message: string;
}