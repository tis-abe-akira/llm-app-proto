import type { Message } from '../types/chat';

const API_BASE_URL = 'http://localhost:8000';

export class ChatService {
  async sendMessage(message: string, sessionId?: string, botId?: string): Promise<{ stream: ReadableStream; sessionId: string }> {
    const requestBody = {
      message,
      session_id: sessionId,
      bot_id: botId,
    };
    
    console.log('=== Frontend Chat Request ===');
    console.log('Message:', message);
    console.log('Session ID:', sessionId);
    console.log('Bot ID:', botId);
    console.log('Bot ID type:', typeof botId);
    console.log('Bot ID === null:', botId === null);
    console.log('Bot ID === undefined:', botId === undefined);
    console.log('Request body:', requestBody);
    console.log('Request body JSON:', JSON.stringify(requestBody));
    
    const response = await fetch(`${API_BASE_URL}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  async getLatestMessage(sessionId: string): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/chat/latest/${sessionId}`);
    
    if (!response.ok) {
      throw new Error('Failed to get latest message');
    }

    const data = await response.json();
    return data.content;
  }
}

export const chatService = new ChatService();
