#!/bin/bash

# 🎌 観光案内チャットボット - フロントエンド起動スクリプト

echo "🎌 観光案内チャットボット - フロントエンド起動中..."
echo ""

# ポート3000が使用中かチェック
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "❌ ポート3000は既に使用中です。"
    echo "既存のプロセスを終了してから再実行してください。"
    echo ""
    echo "使用中のプロセス:"
    lsof -i :3000
    exit 1
fi

# フロントエンドディレクトリに移動
cd "$(dirname "$0")"

echo "📂 現在のディレクトリ: $(pwd)"
echo "🌐 HTTPサーバーを localhost:3000 で起動します..."
echo ""
echo "🔗 ブラウザで以下のURLにアクセスしてください:"
echo "   http://localhost:3000"
echo ""
echo "⚠️  注意: バックエンドサーバーも起動してください:"
echo "   cd ../backend && ./start-server.sh"
echo ""
echo "🛑 サーバーを停止するには Ctrl+C を押してください"
echo "=================================================="
echo ""

# Python3でHTTPサーバーを起動
python3 -m http.server 3000