# LangChain RAG Chat Application

React + Vite + TypeScript フロントエンド と uv + FastAPI + LangChain バックエンドを使ったRAG（Retrieval-Augmented Generation）対応のチャットアプリケーションです。

## 機能

### 基本チャット機能
- ✅ ストリーミングレスポンスによるリアルタイム表示
- ✅ LangChain による会話メモリー機能 
- ✅ LocalStorage による会話履歴の永続化
- ✅ サイドバーからの履歴管理
- ✅ OpenAI GPT-4 統合

### RAG機能
- 🤖 **RAG BOT管理**: 専用知識ベースを持つボットの作成・管理
- 📚 **ドキュメントアップロード**: PDF、Markdown、Excelファイルの対応
- 🔍 **ベクトル検索**: ChromaDBによる高速な意味検索
- 💬 **RAGチャット**: アップロードされた文書に基づく回答生成
- ⚡ **リアルタイム処理**: ドキュメントの自動処理と埋め込み生成

### 動作イメージ

![アプリケーションスクリーンショット](./langchain-chat.gif)

## アーキテクチャ

### バックエンド
- **FastAPI** - Python Webフレームワーク
- **LangChain** - LLMアプリケーションフレームワーク
- **ChromaDB** - ベクトルデータベース
- **OpenAI** - 言語モデル及び埋め込みモデル

### フロントエンド
- **React + TypeScript** - UIフレームワーク
- **React Router** - クライアントサイドルーティング
- **Tailwind CSS** - スタイリング
- **Vite** - ビルドツール

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
uv run python -m app.main
```

### フロントエンドを起動

```bash
cd frontend  
npm run dev
```

アプリは http://localhost:5173 で利用できます。

## 使い方

### RAG BOTの作成

1. **RAG Bots**タブに移動
2. **"+ New Bot"**をクリック
3. ボット名と説明（任意）を入力
4. ドキュメントをアップロードして知識ベースを構築
   - 対応形式: PDF、Markdown (.md)、Excel (.xlsx/.xls)

### RAG BOTとのチャット

1. **Chat**タブに移動
2. ボットセレクターでRAG BOTまたは通常チャットを選択
3. 会話開始 - RAG BOTは アップロードされた文書を参照して回答

### ドキュメント管理

- 各ボットのアップロード済みドキュメント一覧表示
- 処理統計（チャンク数、アップロード日時）の確認
- ドキュメントは自動的に処理され埋め込み化

## 設定

`.env` ファイルで OpenAI API キーを設定してください：

```
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
CORS_ORIGINS=["http://localhost:3000", "http://localhost:5173"]
```

## API エンドポイント

### チャット
- `POST /chat/stream` - チャットレスポンスのストリーミング
- `GET /chat/history/{session_id}` - 会話履歴の取得
- `DELETE /chat/history/{session_id}` - 会話履歴のクリア

### RAG BOT管理
- `POST /bots` - 新しいRAG BOTの作成
- `GET /bots` - RAG BOTの一覧取得
- `GET /bots/{bot_id}` - BOT詳細の取得
- `DELETE /bots/{bot_id}` - RAG BOTの削除
- `POST /bots/{bot_id}/documents` - ドキュメントのアップロード

## データ保存

- **チャットセッション**: メモリー内（セッションベース）
- **RAG BOTメタデータ**: `./data/bots/` 内のJSONファイル
- **ベクトル埋め込み**: `./data/vector_db/` 内のChromaDB
- **ドキュメント処理**: 一時ファイル処理（自動クリーンアップ）
