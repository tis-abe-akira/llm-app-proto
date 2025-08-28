# LLMアプリケーションプロトタイプ

Webアプリケーション向けのLLM統合パターンを実証するプロトタイプアプリケーション集。

## プロジェクト

### llm-chat-app

空飛ぶクルマの法律情報システムのためのAWS Bedrock統合Reactアプリケーション。

- **場所**: `./llm-chat-app/`
- **技術**: React 18, TypeScript, Vite, AWS Bedrock
- **目的**: LLM搭載チャットインターフェースによる静的コンテンツ表示

詳細なドキュメントは [llm-chat-app/README.md](./llm-chat-app/README.md) を参照。

### voice-chat

Web Speech APIとAWS Pollyを活用した音声対話型観光案内チャットボット。

- **場所**: `./voice-chat/`
- **技術**: FastAPI, Web Speech API, AWS Polly, WebSocket
- **目的**: 音声認識と音声合成によるリアルタイム双方向音声対話

詳細なドキュメントは [voice-chat/README.md](./voice-chat/README.md) を参照。

### langchain-chat

LangChainとOpenAI GPT-4を活用したストリーミング対応チャットアプリケーション。

- **場所**: `./langchain-chat/`
- **技術**: React + TypeScript, FastAPI, LangChain, OpenAI GPT-4
- **目的**: ストリーミング応答とメモリ機能を持つ汎用チャットシステム

詳細なドキュメントは [langchain-chat/README.md](./langchain-chat/README.md) を参照。

## 注意事項

これらのプロジェクトはPoCやデモ目的のプロトタイプサンプル集であり、本番環境での使用を想定していません。実装はあくまでコンセプト実証や技術検証を目的としています。