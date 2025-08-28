/**
 * BotDetails component for viewing and managing a specific RAG bot
 */

import React, { useState, useRef } from 'react';
import type { RAGBot } from '../types/ragBot';
import { ragBotService } from '../services/ragBotService';

interface BotDetailsProps {
  bot: RAGBot;
  onBotUpdated: (updatedBot: RAGBot) => void;
}

export function BotDetails({ bot, onBotUpdated }: BotDetailsProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedExtensions = ['.pdf', '.md', '.xlsx', '.xls'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      setUploadError(`Unsupported file type. Allowed: ${allowedExtensions.join(', ')}`);
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);
      setUploadSuccess(null);
      
      const result = await ragBotService.uploadDocument(bot.id, file);
      setUploadSuccess(result.message);
      
      // Refresh bot data to show updated document list
      const updatedBot = await ragBotService.getBot(bot.id);
      onBotUpdated(updatedBot);
      
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to upload document');
    } finally {
      setUploading(false);
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const clearMessages = () => {
    setUploadError(null);
    setUploadSuccess(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">{bot.name}</h2>
        {bot.description && (
          <p className="text-gray-600 mt-1">{bot.description}</p>
        )}
        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
          <span>Created: {new Date(bot.created_at).toLocaleDateString()}</span>
          <span>Documents: {bot.document_count}</span>
        </div>
      </div>

      {/* Upload Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Upload Documents</h3>
        
        {uploadError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            <div className="flex justify-between items-center">
              <span>{uploadError}</span>
              <button onClick={clearMessages} className="text-red-500 hover:text-red-700">
                ✕
              </button>
            </div>
          </div>
        )}
        
        {uploadSuccess && (
          <div className="p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
            <div className="flex justify-between items-center">
              <span>{uploadSuccess}</span>
              <button onClick={clearMessages} className="text-green-500 hover:text-green-700">
                ✕
              </button>
            </div>
          </div>
        )}

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.md,.xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
            disabled={uploading}
          />
          
          <div className="space-y-2">
            <div className="text-gray-400 text-4xl">📄</div>
            <div className="text-sm text-gray-600">
              Upload documents to enhance your bot's knowledge
            </div>
            <div className="text-xs text-gray-500">
              Supported formats: PDF, Markdown, Excel (.pdf, .md, .xlsx, .xls)
            </div>
            <button
              onClick={handleUploadClick}
              disabled={uploading}
              className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : 'Choose File'}
            </button>
          </div>
        </div>
      </div>

      {/* Documents List */}
      {bot.documents.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Knowledge Base</h3>
          <div className="space-y-2">
            {bot.documents.map((doc, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{doc.filename}</div>
                  <div className="text-sm text-gray-500">
                    {doc.chunks} chunks • Added {new Date(doc.added_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-green-500">✓</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {bot.documents.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📝</div>
          <div className="text-sm">No documents uploaded yet</div>
          <div className="text-xs">Upload documents to give your bot knowledge to work with</div>
        </div>
      )}
    </div>
  );
}