"""Chat service for dummy streaming conversations.

This module provides dummy chat functionality with session-based memory,
streaming response handling, and conversation history management.
This is a dummy implementation that returns fixed responses without LLM calls.
"""

import asyncio
from typing import AsyncGenerator, List


class Message:
    """Simple message class to replace LangChain message types."""
    
    def __init__(self, content: str, role: str):
        self.content = content
        self.role = role  # "user" or "assistant"


class SimpleMemory:
    """Simple conversation memory implementation to replace LangChain memory."""
    
    def __init__(self):
        self.messages: List[Message] = []
    
    def add_user_message(self, content: str):
        """Add a user message to memory."""
        self.messages.append(Message(content, "user"))
    
    def add_ai_message(self, content: str):
        """Add an AI message to memory."""
        self.messages.append(Message(content, "assistant"))
    
    def clear(self):
        """Clear all messages from memory."""
        self.messages.clear()


class ChatService:
    """Service for managing dummy chat interactions with memory.
    
    Handles streaming dummy responses, conversation memory management,
    and session-based chat history persistence.
    
    Attributes:
        memories: Dictionary storing conversation memories by session ID.
        dummy_responses: List of predefined dummy responses.
    """
    
    def __init__(self):
        """Initialize ChatService with dummy responses and memory storage."""
        self.memories = {}
        self.dummy_responses = [
            "こんにちは！これはダミーの応答です。実際のLLMは呼び出されていません。",
            "お疲れ様です！固定の応答をお返ししています。",
            "ダミーチャットサービスが正常に動作しています。",
            "これはテスト用の固定メッセージです。LLM APIは使用していません。",
            "シンプルなダミー応答をストリーミング形式でお届けしています。"
        ]
        self.response_counter = 0
    
    def get_or_create_memory(self, session_id: str) -> SimpleMemory:
        """Get existing memory or create new one for session.
        
        Args:
            session_id: Unique session identifier.
            
        Returns:
            SimpleMemory: Memory instance for the session.
        """
        if session_id not in self.memories:
            self.memories[session_id] = SimpleMemory()
        return self.memories[session_id]
    
    async def chat_stream(self, message: str, session_id: str) -> AsyncGenerator[str, None]:
        """Stream dummy chat response with conversation memory.
        
        Returns a predefined dummy response character by character to simulate
        streaming, and updates conversation memory.
        
        Args:
            message: User's input message.
            session_id: Session identifier for memory context.
            
        Yields:
            str: Response chunks simulating streaming.
        """
        memory = self.get_or_create_memory(session_id)
        
        # ダミー応答を選択（順番にローテーション）
        response_content = self.dummy_responses[self.response_counter % len(self.dummy_responses)]
        self.response_counter += 1
        
        # ユーザーのメッセージを考慮したカスタム応答
        if "こんにちは" in message.lower() or "hello" in message.lower():
            response_content = "こんにちは！ダミーチャットサービスです。お元気ですか？"
        elif "ありがとう" in message.lower() or "thank" in message.lower():
            response_content = "どういたしまして！これはダミーの応答ですが、お役に立てて嬉しいです。"
        elif "?" in message or "？" in message:
            response_content = "良い質問ですね！ただし、これはダミーサービスなので実際の回答はできません。"
        
        print(f"Dummy response: {repr(response_content)}")
        
        # 文字ごとにストリーミングをシミュレート
        buffer = ""
        for i, char in enumerate(response_content):
            buffer += char
            
            # 数文字ごとにチャンクを送信
            if len(buffer) >= 3 or i == len(response_content) - 1:
                print(f"Sending buffer: {repr(buffer)}")
                yield buffer
                buffer = ""
                # ストリーミング効果のための短い遅延
                await asyncio.sleep(0.05)
        
        memory.add_user_message(message)
        memory.add_ai_message(response_content)
    
    def get_chat_history(self, session_id: str) -> list:
        """Retrieve conversation history for a session.
        
        Converts internal message format to API-friendly format
        with role and content fields.
        
        Args:
            session_id: Session identifier to retrieve history for.
            
        Returns:
            list: List of message dictionaries with role and content.
        """
        if session_id not in self.memories:
            return []
        
        messages = self.memories[session_id].messages
        history = []
        
        for msg in messages:
            history.append({"role": msg.role, "content": msg.content})
        
        return history
    
    def clear_memory(self, session_id: str):
        """Clear conversation memory for a session.
        
        Args:
            session_id: Session identifier to clear memory for.
        """
        if session_id in self.memories:
            self.memories[session_id].clear()


chat_service = ChatService()