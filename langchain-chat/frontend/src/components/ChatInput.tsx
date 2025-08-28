import React, { useState, KeyboardEvent, useRef, useEffect } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled = false }) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(Math.max(textarea.scrollHeight, 42), 120);
      textarea.style.height = `${newHeight}px`;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    adjustTextareaHeight();
  };

  const handleSubmit = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      // リセット後に高さを調整
      setTimeout(adjustTextareaHeight, 0);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  return (
    <div className="border-t border-gray-200 p-4 bg-white">
      <div className="flex space-x-2">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Type your message here..."
          disabled={disabled}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 overflow-hidden"
          rows={1}
          style={{ minHeight: '42px', maxHeight: '120px', height: '42px' }}
        />
        <button
          onClick={handleSubmit}
          disabled={!message.trim() || disabled}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
};