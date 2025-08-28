import { useState, useEffect, useCallback } from 'react';
import { ChatSession } from '../types/chat';

const STORAGE_KEY = 'langchain-chat-sessions';

export const useChatHistory = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  useEffect(() => {
    const savedSessions = localStorage.getItem(STORAGE_KEY);
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        const sessions = parsed.map((session: any) => ({
          ...session,
          createdAt: new Date(session.createdAt),
          updatedAt: new Date(session.updatedAt),
          messages: session.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        }));
        setSessions(sessions);
      } catch (error) {
        console.error('Error loading chat sessions:', error);
        setSessions([]);
      }
    }
  }, []);

  const saveSession = useCallback((session: ChatSession) => {
    setSessions(prev => {
      const existing = prev.find(s => s.id === session.id);
      let updated;
      
      if (existing) {
        updated = prev.map(s => s.id === session.id ? { ...session, updatedAt: new Date() } : s);
      } else {
        updated = [...prev, session];
      }
      
      updated.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteSession = useCallback((sessionId: string) => {
    setSessions(prev => {
      const updated = prev.filter(s => s.id !== sessionId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearAllSessions = useCallback(() => {
    setSessions([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    sessions,
    saveSession,
    deleteSession,
    clearAllSessions,
  };
};