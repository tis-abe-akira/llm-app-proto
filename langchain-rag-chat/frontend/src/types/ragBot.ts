/**
 * Type definitions for RAG BOT management
 */

export interface Document {
  filename: string;
  added_at: string;
  chunks: number;
}

export type BotStatus = 'creating' | 'processing' | 'ready' | 'error';

export interface ProcessingProgress {
  current_step: string;
  total_steps: number;
  completed_steps: number;
  message: string;
}

export interface RAGBot {
  id: string;
  name: string;
  description: string;
  created_at: string;
  documents: Document[];
  document_count: number;
  status: BotStatus;
  processing_progress?: ProcessingProgress;
  error_message?: string;
}

export interface CreateBotRequest {
  name: string;
  description?: string;
}

export interface BotUploadResult {
  message: string;
}