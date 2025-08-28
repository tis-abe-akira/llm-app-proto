# LangChain Chat Application

React + Vite + TypeScript フロントエンド と uv + FastAPI + LangChain バックエンドを使ったストリーミング対応のチャットアプリケーションです。

## 機能

- ✅ ストリーミングレスポンスによるリアルタイム表示
- ✅ LangChain による会話メモリー機能 
- ✅ LocalStorage による会話履歴の永続化
- ✅ サイドバーからの履歴管理
- ✅ OpenAI GPT-4.1 統合

## セットアップ

### 1. バックエンド

```bash
cd backend
uv sync
cp .env.example .env
# .env ファイルに OPENAI_API_KEY を設定
```

### 2. フロントエンド  

```bash
cd frontend
npm install
```

## 実行

### バックエンドを起動

```bash
cd backend
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### フロントエンドを起動

```bash
cd frontend  
npm run dev
```

アプリは http://localhost:5173 で利用できます。

## 設定

`.env` ファイルで OpenAI API キーを設定してください：

```
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4-turbo-preview
```