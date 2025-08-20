# LLM Application Prototype

Prototype application demonstrating LLM integration patterns for web applications.

## Projects

### llm-chat-app

React application with AWS Bedrock integration for flying car law information system.

- **Location**: `./llm-chat-app/`
- **Technology**: React 18, TypeScript, Vite, AWS Bedrock
- **Purpose**: Static content display with LLM-powered chat interface

See [llm-chat-app/README.md](./llm-chat-app/README.md) for detailed documentation.

## Requirements

- Node.js 18+
- AWS account with Bedrock access
- AWS credentials with Bedrock permissions

## Quick Start

```bash
cd llm-chat-app
npm install
cp .env.example .env
# Configure AWS credentials in .env
npm run dev
```