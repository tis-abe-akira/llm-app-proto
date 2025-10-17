# LangChain Chat Dummy Backend

ストリーミングレスポンスと会話記憶機能を備えたダミーチャットのFastAPIバックエンドサービス。

**注意: これはダミー実装です。実際のLLMは呼び出されず、事前定義された応答を返します。**

## 技術スタック

- FastAPI - Webフレームワーク  
- uv - 依存関係管理
- Python 3.11+
- (LangChainとOpenAI依存を削除済み)

## プロジェクト構造

```
app/
├── core/                # 核心設定
│   └── config.py       # 設定管理（ダミー用）
├── services/           # ビジネスロジック
│   └── chat_service.py # ダミーチャット・メモリー処理
└── main.py            # FastAPIアプリケーション
```

## 機能

- ストリーミングダミーレスポンス
- セッション毎の会話記憶
- 固定応答の自動選択
- フロントエンド向けCORSサポート
- セッションベースのチャット履歴
- LLM API不要のテスト環境

## セットアップ

```bash
uv sync
# .envファイルは不要（ダミー実装のため）
```

## 環境設定

特別な環境設定は不要です。OpenAI APIキーなどの外部サービス設定は必要ありません。

## 開発

```bash
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## APIエンドポイント

- `POST /chat/stream` - ストリーミングチャットレスポンス
- `GET /chat/history/{session_id}` - 会話履歴取得
- `GET /chat/latest/{session_id}` - 最新のフォーマット済メッセージ取得
- `DELETE /chat/history/{session_id}` - セッション履歴削除

## 依存関係

- `fastapi` - Webフレームワーク
- `uvicorn` - ASGIサーバー
- `langchain` - LLMフレームワーク
- `langchain-openai` - OpenAI統合
- `pydantic` - データ検証
- `python-dotenv` - 環境管理

## LangChain活用機能

このアプリケーションでは、LangChainの以下の機能を活用しています:

### 1. ChatOpenAI
- OpenAI GPT-4モデルとの統合
- ストリーミングレスポンス機能 (`streaming=True`)
- 温度設定による出力制御 (`temperature=0.7`)

### 2. ConversationBufferMemory
- セッションベースの会話記憶管理
- メッセージ履歴の自動保持 (`return_messages=True`)
- チャット履歴のキー管理 (`memory_key="chat_history"`)

### 3. Message Schema
- HumanMessage: ユーザーメッセージの構造化
- AIMessage: アシスタントメッセージの構造化
- メッセージ履歴の一貫した管理

### 4. Streaming機能
- `astream()` を使用したリアルタイム応答生成
- チャンクベースの応答配信
- バッファリングによる効率的な出力制御

これらのLangChain機能により、マルチターン会話の文脈保持、効率的なストリーミング、構造化されたメッセージ管理を実現しています。
