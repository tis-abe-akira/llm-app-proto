"""FastAPI application for LangChain-powered chat service.

This module provides REST API endpoints for streaming chat interactions
using LangChain and OpenAI GPT models with conversation memory support.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import uuid
from app.core.config import settings
from app.services.chat_service import chat_service


app = FastAPI(title="LangChain Chat API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    """Request model for chat interactions.
    
    Attributes:
        message: The user's message content.
        session_id: Optional session identifier for conversation continuity.
    """
    message: str
    session_id: str | None = None


class ChatHistoryResponse(BaseModel):
    """Response model for chat history retrieval.
    
    Attributes:
        session_id: The session identifier.
        messages: List of message dictionaries containing conversation history.
    """
    session_id: str
    messages: list[dict]


@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """Stream chat responses in real-time.
    
    Args:
        request: Chat request containing message and optional session ID.
        
    Returns:
        StreamingResponse: Server-sent events stream with chat response chunks.
        
    Raises:
        HTTPException: If message is empty.
    """
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    
    session_id = request.session_id or str(uuid.uuid4())
    
    async def generate():
        async for chunk in chat_service.chat_stream(request.message, session_id):
            yield f"data: {chunk}\n\n"
        yield "data: [DONE]\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/plain",
        headers={
            "X-Session-ID": session_id,
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        }
    )


@app.get("/chat/history/{session_id}")
async def get_chat_history(session_id: str) -> ChatHistoryResponse:
    """Retrieve complete chat history for a session.
    
    Args:
        session_id: Unique session identifier.
        
    Returns:
        ChatHistoryResponse: Session ID and list of all messages.
    """
    messages = chat_service.get_chat_history(session_id)
    return ChatHistoryResponse(session_id=session_id, messages=messages)


@app.get("/chat/latest/{session_id}")
async def get_latest_message(session_id: str):
    """Get the latest assistant message from a session.
    
    Args:
        session_id: Unique session identifier.
        
    Returns:
        dict: Latest assistant message content and timestamp.
        
    Raises:
        HTTPException: If no messages found or latest message is not from assistant.
    """
    messages = chat_service.get_chat_history(session_id)
    if not messages:
        raise HTTPException(status_code=404, detail="No messages found")
    
    latest_message = messages[-1]
    if latest_message["role"] != "assistant":
        raise HTTPException(status_code=404, detail="Latest message is not from assistant")
    
    return {
        "content": latest_message["content"],
        "timestamp": latest_message.get("timestamp", "")
    }


@app.delete("/chat/history/{session_id}")
async def clear_chat_history(session_id: str):
    """Clear all chat history for a session.
    
    Args:
        session_id: Unique session identifier.
        
    Returns:
        dict: Confirmation message.
    """
    chat_service.clear_memory(session_id)
    return {"message": "Chat history cleared"}


@app.get("/")
async def root():
    """Health check endpoint.
    
    Returns:
        dict: API status message.
    """
    return {"message": "LangChain Chat API is running"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)