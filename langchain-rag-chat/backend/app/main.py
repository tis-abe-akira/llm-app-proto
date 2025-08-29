"""FastAPI application for LangChain-powered chat service.

This module provides REST API endpoints for streaming chat interactions
using LangChain and OpenAI GPT models with conversation memory support.
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import uuid
import tempfile
import os
from app.core.config import settings
from app.services.chat_service import chat_service
from app.services.rag_bot_service import rag_bot_service


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
        bot_id: Optional RAG bot identifier for knowledge-based responses.
    """
    message: str
    session_id: str | None = None
    bot_id: str | None = None


class ChatHistoryResponse(BaseModel):
    """Response model for chat history retrieval.
    
    Attributes:
        session_id: The session identifier.
        messages: List of message dictionaries containing conversation history.
    """
    session_id: str
    messages: list[dict]


class CreateBotRequest(BaseModel):
    """Request model for creating a new RAG bot.
    
    Attributes:
        name: The bot's display name.
        description: Optional bot description.
    """
    name: str
    description: str = ""


class ProcessingProgress(BaseModel):
    """Model for document processing progress information.
    
    Attributes:
        current_step: Current processing step description.
        total_steps: Total number of processing steps.
        completed_steps: Number of completed steps.
        message: Detailed progress message.
    """
    current_step: str
    total_steps: int
    completed_steps: int
    message: str


class BotResponse(BaseModel):
    """Response model for RAG bot information.
    
    Attributes:
        id: The bot's unique identifier.
        name: The bot's display name.
        description: The bot's description.
        created_at: Bot creation timestamp.
        documents: List of uploaded documents.
        document_count: Number of documents in the bot's knowledge base.
        status: Current bot status.
        processing_progress: Optional processing progress information.
        error_message: Optional error message if status is error.
    """
    id: str
    name: str
    description: str
    created_at: str
    documents: list[dict]
    document_count: int
    status: str
    processing_progress: Optional[ProcessingProgress] = None
    error_message: Optional[str] = None


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
    print(f"=== Chat Request ===")
    print(f"Message: {request.message}")
    print(f"Session ID: {request.session_id}")
    print(f"Bot ID: {request.bot_id}")
    print(f"Bot ID type: {type(request.bot_id)}")
    print(f"Bot ID repr: {repr(request.bot_id)}")
    print(f"Raw request data would be visible in FastAPI logs")
    
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    
    session_id = request.session_id or str(uuid.uuid4())
    
    async def generate():
        async for chunk in chat_service.chat_stream(request.message, session_id, request.bot_id):
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


# RAG Bot Management Endpoints

@app.post("/bots", response_model=BotResponse)
async def create_bot(request: CreateBotRequest):
    """Create a new RAG bot.
    
    Args:
        request: Bot creation request with name and description.
        
    Returns:
        BotResponse: Created bot information.
    """
    bot_data = rag_bot_service.create_bot(request.name, request.description)
    return BotResponse(**bot_data)


@app.get("/bots", response_model=list[BotResponse])
async def list_bots():
    """List all available RAG bots.
    
    Returns:
        list[BotResponse]: List of all RAG bots.
    """
    bots = rag_bot_service.list_bots()
    return [BotResponse(**bot) for bot in bots]


@app.get("/bots/{bot_id}", response_model=BotResponse)
async def get_bot(bot_id: str):
    """Get RAG bot information by ID.
    
    Args:
        bot_id: Bot unique identifier.
        
    Returns:
        BotResponse: Bot information.
        
    Raises:
        HTTPException: If bot not found.
    """
    bot_data = rag_bot_service.get_bot(bot_id)
    if not bot_data:
        raise HTTPException(status_code=404, detail="Bot not found")
    return BotResponse(**bot_data)


@app.delete("/bots/{bot_id}")
async def delete_bot(bot_id: str):
    """Delete a RAG bot and all its data.
    
    Args:
        bot_id: Bot unique identifier.
        
    Returns:
        dict: Confirmation message.
        
    Raises:
        HTTPException: If bot not found.
    """
    success = rag_bot_service.delete_bot(bot_id)
    if not success:
        raise HTTPException(status_code=404, detail="Bot not found")
    return {"message": "Bot deleted successfully"}


@app.get("/bots/{bot_id}/status")
async def get_bot_status(bot_id: str):
    """Get current status of a RAG bot.
    
    Args:
        bot_id: Bot unique identifier.
        
    Returns:
        dict: Bot status information including processing progress.
        
    Raises:
        HTTPException: If bot not found.
    """
    bot_data = rag_bot_service.get_bot(bot_id)
    if not bot_data:
        raise HTTPException(status_code=404, detail="Bot not found")
    
    return {
        "status": bot_data.get("status", "ready"),
        "processing_progress": bot_data.get("processing_progress"),
        "error_message": bot_data.get("error_message")
    }


@app.post("/bots/{bot_id}/documents")
async def upload_document(
    bot_id: str,
    file: UploadFile = File(...),
):
    """Upload and process a document for a RAG bot.
    
    Args:
        bot_id: Bot unique identifier.
        file: Document file to upload (PDF, Markdown, or Excel).
        
    Returns:
        dict: Upload result message.
        
    Raises:
        HTTPException: If bot not found or file processing fails.
    """
    # Check if bot exists
    bot_data = rag_bot_service.get_bot(bot_id)
    if not bot_data:
        raise HTTPException(status_code=404, detail="Bot not found")
    
    # Check if bot is in a state that allows document upload
    if bot_data.get("status") == "processing":
        raise HTTPException(status_code=409, detail="Bot is currently processing another document")
    
    # Validate file type
    allowed_extensions = {'.pdf', '.md', '.xlsx', '.xls'}
    file_extension = os.path.splitext(file.filename)[1].lower()
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file type. Allowed: {', '.join(allowed_extensions)}"
        )
    
    # Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
        content = await file.read()
        temp_file.write(content)
        temp_path = temp_file.name
    
    try:
        # Process document
        success = await rag_bot_service.process_document(bot_id, temp_path, file.filename)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to process document")
        
        return {"message": f"Document '{file.filename}' processed successfully"}
    
    except Exception as e:
        # Clean up temp file if processing fails
        if os.path.exists(temp_path):
            os.unlink(temp_path)
        raise HTTPException(status_code=500, detail=f"Document processing failed: {str(e)}")


@app.get("/")
async def root():
    """Health check endpoint.
    
    Returns:
        dict: API status message.
    """
    return {"message": "LangChain RAG Chat API is running"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)