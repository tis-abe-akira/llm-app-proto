/**
 * ProcessingProgress component for displaying RAG bot document processing status
 */

import React from 'react';
import type { ProcessingProgress as ProcessingProgressType } from '../types/ragBot';

interface ProcessingProgressProps {
  progress: ProcessingProgressType;
  className?: string;
}

export function ProcessingProgress({ progress, className = '' }: ProcessingProgressProps) {
  const progressPercentage = (progress.completed_steps / progress.total_steps) * 100;

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700">Processing Document</h3>
        <span className="text-xs text-gray-500">
          {progress.completed_steps}/{progress.total_steps}
        </span>
      </div>
      
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-600">{progress.current_step}</span>
          <span className="text-xs text-gray-500">{Math.round(progressPercentage)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
      
      <p className="text-xs text-gray-600">{progress.message}</p>
    </div>
  );
}