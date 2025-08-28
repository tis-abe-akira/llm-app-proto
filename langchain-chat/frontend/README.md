# LangChain Chat Frontend

React frontend application for LangChain-powered chat interface with streaming responses and conversation history.

## Tech Stack

- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Custom Markdown rendering for code blocks

## Project Structure

```
src/
├── components/          # React components
│   ├── ChatInput.tsx   # Message input with auto-resize
│   ├── ChatMessage.tsx # Message display with Markdown
│   └── Sidebar.tsx     # Chat history sidebar
├── hooks/              # React hooks
│   ├── useChat.ts      # Chat functionality
│   └── useChatHistory.ts # LocalStorage history
├── services/           # API communication
│   └── chatService.ts  # Backend API calls
└── types/             # TypeScript definitions
    └── chat.ts        # Chat data types
```

## Features

- Real-time streaming chat responses
- Markdown rendering with syntax highlighting
- Message copy functionality
- Automatic chat title generation
- LocalStorage-based chat history
- Auto-resizing message input

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## API Integration

Communicates with FastAPI backend at `http://localhost:8000` for:
- Streaming chat responses (`POST /chat/stream`)
- Chat history retrieval (`GET /chat/history/{session_id}`)
- Latest message formatting (`GET /chat/latest/{session_id}`)
