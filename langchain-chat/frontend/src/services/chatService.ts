import { Message, ChatSession } from '../types/chat';

const API_BASE_URL = 'http://localhost:8000';

export class ChatService {
  async sendMessage(message: string, sessionId?: string): Promise<{ stream: ReadableStream; sessionId: string }> {
    const response = await fetch(`${API_BASE_URL}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        session_id: sessionId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    const responseSessionId = response.headers.get('X-Session-ID') || sessionId || '';
    
    return {
      stream: response.body!,
      sessionId: responseSessionId,
    };
  }

  async getChatHistory(sessionId: string): Promise<Message[]> {
    const response = await fetch(`${API_BASE_URL}/chat/history/${sessionId}`);
    
    if (!response.ok) {
      throw new Error('Failed to get chat history');
    }

    const data = await response.json();
    return data.messages.map((msg: any, index: number) => ({
      id: `${sessionId}-${index}`,
      role: msg.role,
      content: msg.content,
      timestamp: new Date(),
    }));
  }

  async clearChatHistory(sessionId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/chat/history/${sessionId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to clear chat history');
    }
  }
}

export const chatService = new ChatService();