# LangChain Chat Dummy Frontend

ストリーミングレスポンスと会話履歴を備えたダミーチャットインターフェースのReactフロントエンドアプリケーション。

**注意: これはダミー実装のフロントエンドです。バックエンドは実際のLLMではなく固定応答を返します。**

## 技術スタック

- React 18 with TypeScript
- Vite - ビルドツール
- Tailwind CSS - スタイリング
- カスタムMarkdownレンダリング - コードブロック対応

## プロジェクト構造

```
src/
├── components/          # Reactコンポーネント
│   ├── ChatInput.tsx   # 自動リサイズ対応メッセージ入力
│   ├── ChatMessage.tsx # Markdown対応メッセージ表示
│   └── Sidebar.tsx     # チャット履歴サイドバー
├── hooks/              # Reactフック
│   ├── useChat.ts      # チャット機能
│   └── useChatHistory.ts # LocalStorage履歴管理
├── services/           # API通信
│   └── chatService.ts  # バックエンドAPI呼び出し
└── types/             # TypeScript型定義
    └── chat.ts        # チャットデータ型
```

## 機能

- リアルタイムストリーミングチャットレスポンス
- シンタックスハイライト付きMarkdownレンダリング
- メッセージコピー機能
- 自動チャットタイトル生成
- LocalStorageベースのチャット履歴
- 自動リサイズメッセージ入力

## 開発

```bash
npm install
npm run dev
```

## ビルド

```bash
npm run build
```

## API統合

`http://localhost:8000`のFastAPIバックエンドと通信:
- ストリーミングチャットレスポンス (`POST /chat/stream`)
- チャット履歴取得 (`GET /chat/history/{session_id}`)
- 最新メッセージフォーマット取得 (`GET /chat/latest/{session_id}`)
