import React, { useState } from 'react';
import type { Message } from '../types/chat';

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
}

interface MessageContentProps {
  content: string;
}

const MessageContent: React.FC<MessageContentProps> = ({ content }) => {
  console.log('=== MessageContent Debug ===');
  console.log('Raw content:', JSON.stringify(content));
  console.log('Content length:', content.length);
  console.log('Has newlines:', content.includes('\n'));
  console.log('Newline positions:', [...content.matchAll(/\n/g)].map(m => m.index));
  
  const formatMessage = (text: string) => {
    // 正確なコードブロック検出: ```python ... ``` または ``` ... ```
    const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
    const inlineCodeRegex = /`([^`]+)`/g;
    
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let blockIndex = 0;

    // コードブロックを処理
    while ((match = codeBlockRegex.exec(text)) !== null) {
      console.log('Found code block:', {
        fullMatch: match[0],
        language: match[1],
        code: match[2],
        index: match.index
      });
      
      // コードブロック前のテキスト
      if (match.index > lastIndex) {
        const beforeText = text.slice(lastIndex, match.index);
        parts.push(
          <span key={`text-${lastIndex}`} className="whitespace-pre-wrap">
            {processInlineCode(beforeText, inlineCodeRegex)}
          </span>
        );
      }

      const language = match[1] || 'text';
      const code = match[2].trim();
      
      // コードブロックを追加
      parts.push(
        <div key={`code-${blockIndex++}`} className="my-3">
          <div className="bg-gray-900 text-gray-100 rounded-lg overflow-hidden">
            <div className="bg-gray-700 px-4 py-2 text-sm text-gray-300 border-b border-gray-600">
              {language}
            </div>
            <pre className="p-4 overflow-x-hidden">
              <code className="text-sm font-mono whitespace-pre-wrap break-words block">
                {code}
              </code>
            </pre>
          </div>
        </div>
      );

      lastIndex = match.index + match[0].length;
    }

    // 残りのテキスト
    if (lastIndex < text.length) {
      const remainingText = text.slice(lastIndex);
      parts.push(
        <span key={`text-${lastIndex}`} className="whitespace-pre-wrap">
          {processInlineCode(remainingText, inlineCodeRegex)}
        </span>
      );
    }

    return parts.length > 0 ? parts : [
      <span key="content" className="whitespace-pre-wrap">
        {processInlineCode(text, inlineCodeRegex)}
      </span>
    ];
  };

  const processInlineCode = (text: string, regex: RegExp) => {
    const parts = text.split(regex);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return (
          <code key={index} className="bg-gray-200 text-gray-800 px-1 py-0.5 rounded text-sm font-mono">
            {part}
          </code>
        );
      }
      return part;
    });
  };

  return <div className="break-words">{formatMessage(content)}</div>;
};


export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isStreaming = false }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 group`}>
      <div
        className={`max-w-[80%] px-4 py-2 rounded-lg relative ${
          isUser
            ? 'bg-blue-500 text-white ml-auto'
            : 'bg-gray-100 text-gray-800 mr-auto'
        }`}
      >
        {!isUser && (
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 rounded-md text-xs bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 shadow-sm"
            title="Copy message"
          >
            {copied ? '✅ Copied!' : '📋 Copy'}
          </button>
        )}
        
        <div className={`${!isUser ? 'pr-20' : ''}`}>
          {isUser ? (
            <div className="whitespace-pre-wrap break-words">
              {message.content}
            </div>
          ) : (
            <MessageContent content={message.content} />
          )}
          
          {isStreaming && (
            <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />
          )}
        </div>
      </div>
    </div>
  );
};
