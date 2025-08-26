# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

音声対話型観光案内チャットボット。Web Speech API（ブラウザネイティブ音声認識）とAWS Polly音声合成を活用したWebSocketベースのFastAPIバックエンドと、美しいWebフロントエンドを提供。

### 構成
- **backend/**: FastAPIベースのWebSocketサーバー（AWS Polly音声合成）
- **frontend/**: HTML5/JavaScript製のWebクライアント（Web Speech API音声認識）

## 開発環境とコマンド

### 依存関係の管理
```bash
# 依存関係のインストール
cd backend && uv sync

# 新しいパッケージの追加
uv add <package-name>

# 開発依存関係の追加
uv add --dev <package-name>
```

### サーバー起動
```bash
# 開発サーバー起動（backend ディレクトリから）
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# プロダクション起動
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### テストとリンティング
```bash
# テスト実行
uv run pytest

# コード整形
uv run black app/
uv run isort app/

# 型チェック
uv run mypy app/

# リンティング
uv run flake8 app/
```

### Webクライアント起動
```bash
# ブラウザでHTMLファイルを開く
open frontend/index.html

# または、HTTPサーバーを起動
cd frontend
python3 -m http.server 3000
# http://localhost:3000 にアクセス
```

### ヘルスチェック
```bash
# サーバー起動確認
curl http://localhost:8000/health

# アクティブ接続数確認
curl http://localhost:8000/connections
```

## アーキテクチャ

### レイヤード設計
- **app/main.py**: FastAPIアプリケーション、WebSocket管理、HTTPエンドポイント
- **app/core/config.py**: pydantic-settingsによる環境変数管理
- **app/services/**: ビジネスロジック層
  - **aws_services.py**: AWS Polly音声合成サービス
  - **chat_service.py**: 観光案内AI、キーワード分析、応答生成

### WebSocket通信フロー（新アーキテクチャ）
1. クライアントがWebSocket接続(`/ws/{client_id}`)
2. **音声認識**: ブラウザのWeb Speech APIで音声をテキスト変換
3. **テキスト送信**: 認識結果をJSON形式でサーバーに送信
4. **観光プラン生成**: chat_serviceで処理され観光プラン提案
5. **音声合成**: 応答テキストがAWS Pollyで音声合成、クライアントに配信

### 音声処理の分離設計
- **フロントエンド**: Web Speech API（音声→テキスト）
- **バックエンド**: AWS Polly（テキスト→音声）
- **通信**: テキストベースのWebSocket通信のみ

### 設定管理
全ての設定は`app/core/config.py`のSettingsクラスで管理。AWS認証情報、音声設定、CORS設定等を環境変数(.env)から読み込み。

## AWS設定要件

### 必須の環境変数
```
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=ap-northeast-1
```

### 必要なAWS権限
IAMユーザーに`polly:*`の権限が必要。

### 音声設定
- **Web Speech API**: ブラウザネイティブ、日本語(ja-JP)、自動サンプルレート
- **AWS Polly**: Takumi音声、MP3出力、22050Hzサンプルレート

## WebSocketメッセージ仕様

### 送信（クライアント→サーバー）
- **テキストメッセージ**: JSON形式
  ```json
  {"type": "chat", "data": "のんびりできる温泉旅行を教えて"}
  {"type": "clear_history", "data": ""}
  {"type": "get_history", "data": ""}
  ```

### 受信（サーバー→クライアント）
- **connection**: 接続完了通知
- **chat_response**: 観光プラン提案（message, recommendations, detected_style含む）
- **audio**: 音声合成データ（バイナリ）
- **speech_synthesis_start/complete**: 音声合成状態
- **error**: エラー情報

## 音声入力制御システム

### 送信モード
- **自動送信モード**: 無音3秒または200文字で自動送信
- **手動送信モード**: 明示的に送信ボタンを押すまで送信しない

### 機能
- リアルタイム音声認識結果表示
- 送信タイミング制御
- 音声認識結果のテキスト入力欄表示

## 観光プラン検索ロジック

### キーワードベース分析
`KeywordAnalyzer`が正規表現でユーザー入力を分析し、旅行スタイル（のんびり、アクティブ、食事、文化、自然、ファミリー）を特定。

### データベース構造
`TourismDatabase`に各スタイル別の観光プラン情報（TourismRecommendation）を格納。各プランは場所、期間、予算、見どころを含む。

### 応答生成
検出スタイルに基づいてランダムな観光プランを選択し、テンプレートベースで簡潔な日本語応答を生成。音声読み上げを考慮し、「〜」は「から」に自動変換。

## 将来の拡張ポイント

現在のキーワードベースシステムはLangChain統合の準備完了。chat_service.pyにBaseMessage, HumanMessage, AIMessageのインポートと会話履歴管理機能が実装済み。

### マルチプラットフォーム対応
- **iOS**: Speech Framework活用
- **Android**: SpeechRecognizer API活用
- **統一アーキテクチャ**: クライアント側音声認識 + サーバー側音声合成

## トラブルシューティング

### AWS認証エラー
```bash
uv run python -c "import boto3; print(boto3.Session().get_credentials())"
```

### WebSocket接続確認
```bash
lsof -i :8000
```

### ログレベル調整
`.env`ファイルで`LOG_LEVEL=DEBUG`設定で詳細ログ出力。

### Web Speech API対応確認
- Chrome、Edge、Safari（最新版）で動作確認
- HTTPSまたはlocalhostでのみ動作（セキュリティ制限）