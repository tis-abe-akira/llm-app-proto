"""Chat service for LangChain-powered streaming conversations.

This module provides the core chat functionality with session-based memory,
streaming response handling, and conversation history management.
"""

from typing import AsyncGenerator, Optional
from langchain_openai import ChatOpenAI
from langchain.memory import ConversationBufferMemory
from langchain.schema import HumanMessage, AIMessage, SystemMessage
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from app.core.config import settings
from app.services.rag_bot_service import rag_bot_service


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
    
    async def chat_stream(self, message: str, session_id: str, bot_id: Optional[str] = None) -> AsyncGenerator[str, None]:
        """Stream chat response with conversation memory and optional RAG.
        
        Processes user message through LLM with conversation context,
        optionally using RAG for knowledge-based responses,
        streams response chunks, and updates conversation memory.
        
        Args:
            message: User's input message.
            session_id: Session identifier for memory context.
            bot_id: Optional RAG bot ID for knowledge-based responses.
            
        Yields:
            str: Response chunks from the LLM.
        """
        memory = self.get_or_create_memory(session_id)
        
        if bot_id:
            # RAG-enabled chat
            async for chunk in self._chat_with_rag(message, memory, bot_id):
                yield chunk
        else:
            # Regular chat
            async for chunk in self._chat_regular(message, memory):
                yield chunk
    
    async def _chat_regular(self, message: str, memory: ConversationBufferMemory) -> AsyncGenerator[str, None]:
        """Handle regular chat without RAG functionality.
        
        Args:
            message: User's input message.
            memory: Conversation memory for context.
            
        Yields:
            str: Response chunks from the LLM.
        """
        messages = memory.chat_memory.messages + [HumanMessage(content=message)]
        
        response_content = ""
        buffer = ""
        async for chunk in self.llm.astream(messages):
            if chunk.content:
                response_content += chunk.content
                buffer += chunk.content
                
                # Send larger chunks for better performance
                if len(buffer) >= 10 or '\n' in buffer:
                    yield buffer
                    buffer = ""
        
        # Send remaining buffer
        if buffer:
            yield buffer
        
        # Update conversation memory
        memory.chat_memory.add_user_message(message)
        memory.chat_memory.add_ai_message(response_content)
    
    async def _chat_with_rag(self, message: str, memory: ConversationBufferMemory, bot_id: str) -> AsyncGenerator[str, None]:
        """Handle RAG-enabled chat with document knowledge.
        
        Args:
            message: User's input message.
            memory: Conversation memory for context.
            bot_id: RAG bot identifier for document search.
            
        Yields:
            str: Response chunks from the LLM.
        """
        print(f"=== RAG Chat Started ===")
        print(f"Bot ID: {bot_id}")
        print(f"User message: {message}")
        
        # Search relevant documents
        relevant_docs = rag_bot_service.search_documents(bot_id, message, k=4)
        print(f"Found {len(relevant_docs)} relevant documents")
        
        if relevant_docs:
            # Create RAG prompt with context
            context = "\n\n".join(relevant_docs)
            rag_prompt = f"""あなたは提供された文書に基づいて質問に答えるアシスタントです。
文書の内容に基づいて正確で有用な回答を提供してください。
文書に関連する情報が見つからない場合は、それを明確に伝えてください。

関連する文書内容:
{context}

ユーザーの質問: {message}
"""
            
            # Create messages with RAG context
            messages = memory.chat_memory.messages + [HumanMessage(content=rag_prompt)]
        else:
            # No relevant documents found, proceed with regular chat
            messages = memory.chat_memory.messages + [
                SystemMessage(content="提供された文書に関連する情報が見つかりませんでした。一般的な知識に基づいて回答します。"),
                HumanMessage(content=message)
            ]
        
        response_content = ""
        buffer = ""
        async for chunk in self.llm.astream(messages):
            if chunk.content:
                response_content += chunk.content
                buffer += chunk.content
                
                # Send larger chunks for better performance
                if len(buffer) >= 10 or '\n' in buffer:
                    yield buffer
                    buffer = ""
        
        # Send remaining buffer
        if buffer:
            yield buffer
        
        # Update conversation memory with original user message
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