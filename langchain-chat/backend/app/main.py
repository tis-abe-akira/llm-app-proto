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
    message: str
    session_id: str | None = None


class ChatHistoryResponse(BaseModel):
    session_id: str
    messages: list[dict]


@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    
    session_id = request.session_id or str(uuid.uuid4())
    
    async def generate():
        async for chunk in chat_service.chat_stream(request.message, session_id):
            yield f"data: {chunk}\n\n"
        yield f"data: [DONE]\n\n"
    
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
    messages = chat_service.get_chat_history(session_id)
    return ChatHistoryResponse(session_id=session_id, messages=messages)


@app.delete("/chat/history/{session_id}")
async def clear_chat_history(session_id: str):
    chat_service.clear_memory(session_id)
    return {"message": "Chat history cleared"}


@app.get("/")
async def root():
    return {"message": "LangChain Chat API is running"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)