"""Chat service for LangChain-powered streaming conversations.

This module provides the core chat functionality with session-based memory,
streaming response handling, and conversation history management.
"""

from typing import AsyncGenerator
from langchain_openai import ChatOpenAI
from langchain.memory import ConversationBufferMemory
from langchain.schema import HumanMessage, AIMessage
from app.core.config import settings


class ChatService:
    """Service for managing LangChain chat interactions with memory.
    
    Handles streaming chat responses, conversation memory management,
    and session-based chat history persistence.
    
    Attributes:
        llm: ChatOpenAI instance for LLM interactions.
        memories: Dictionary storing conversation memories by session ID.
    """
    
    def __init__(self):
        """Initialize ChatService with OpenAI LLM and memory storage."""
        self.llm = ChatOpenAI(
            model=settings.openai_model,
            api_key=settings.openai_api_key,
            streaming=True,
            temperature=0.7
        )
        self.memories = {}
    
    def get_or_create_memory(self, session_id: str) -> ConversationBufferMemory:
        """Get existing memory or create new one for session.
        
        Args:
            session_id: Unique session identifier.
            
        Returns:
            ConversationBufferMemory: Memory instance for the session.
        """
        if session_id not in self.memories:
            self.memories[session_id] = ConversationBufferMemory(
                return_messages=True,
                memory_key="chat_history"
            )
        return self.memories[session_id]
    
    async def chat_stream(self, message: str, session_id: str) -> AsyncGenerator[str, None]:
        """Stream chat response with conversation memory.
        
        Processes user message through LLM with conversation context,
        streams response chunks, and updates conversation memory.
        
        Args:
            message: User's input message.
            session_id: Session identifier for memory context.
            
        Yields:
            str: Response chunks from the LLM.
        """
        memory = self.get_or_create_memory(session_id)
        
        messages = memory.chat_memory.messages + [HumanMessage(content=message)]
        
        response_content = ""
        buffer = ""
        async for chunk in self.llm.astream(messages):
            if chunk.content:
                # デバッグ: チャンクの内容を確認
                print(f"Chunk content: {repr(chunk.content)}")
                
                response_content += chunk.content
                buffer += chunk.content
                
                # より大きなチャンクでまとめて送信
                if len(buffer) >= 10 or '\n' in buffer:
                    print(f"Sending buffer: {repr(buffer)}")
                    yield buffer
                    buffer = ""
        
        # 残りのバッファを送信
        if buffer:
            print(f"Sending final buffer: {repr(buffer)}")
            yield buffer
        
        print(f"Final response_content: {repr(response_content)}")
        newline_char = '\n'
        print(f"Response has newlines: {newline_char in response_content}")
        
        memory.chat_memory.add_user_message(message)
        memory.chat_memory.add_ai_message(response_content)
    
    def get_chat_history(self, session_id: str) -> list:
        """Retrieve conversation history for a session.
        
        Converts internal LangChain message format to API-friendly format
        with role and content fields.
        
        Args:
            session_id: Session identifier to retrieve history for.
            
        Returns:
            list: List of message dictionaries with role and content.
        """
        if session_id not in self.memories:
            return []
        
        messages = self.memories[session_id].chat_memory.messages
        history = []
        
        for msg in messages:
            if isinstance(msg, HumanMessage):
                history.append({"role": "user", "content": msg.content})
            elif isinstance(msg, AIMessage):
                history.append({"role": "assistant", "content": msg.content})
        
        return history
    
    def clear_memory(self, session_id: str):
        """Clear conversation memory for a session.
        
        Args:
            session_id: Session identifier to clear memory for.
        """
        if session_id in self.memories:
            self.memories[session_id].clear()


chat_service = ChatService()