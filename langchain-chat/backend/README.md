# LangChain Chat Backend

FastAPI backend service for LangChain-powered chat application with streaming responses and conversation memory.

## Tech Stack

- FastAPI for web framework
- LangChain for LLM integration
- OpenAI GPT-4 for chat completions
- uv for dependency management
- Python 3.11+

## Project Structure

```
app/
├── core/                # Core configuration
│   └── config.py       # Settings management
├── services/           # Business logic
│   └── chat_service.py # Chat and memory handling
└── main.py            # FastAPI application
```

## Features

- Streaming chat responses
- Conversation memory per session
- OpenAI GPT-4 integration
- CORS support for frontend
- Session-based chat history
- Automatic response buffering

## Setup

```bash
uv sync
cp .env.example .env
# Edit .env file with your OpenAI API key
```

## Environment Configuration

Create `.env` file:

```
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o
```

## Development

```bash
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

- `POST /chat/stream` - Streaming chat responses
- `GET /chat/history/{session_id}` - Get conversation history
- `GET /chat/latest/{session_id}` - Get latest formatted message
- `DELETE /chat/history/{session_id}` - Clear session history

## Dependencies

- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `langchain` - LLM framework
- `langchain-openai` - OpenAI integration
- `pydantic` - Data validation
- `python-dotenv` - Environment management