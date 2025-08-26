#!/usr/bin/env python3
"""
観光チャットボット WebSocket テストクライアント

使用方法:
    uv run python test_client.py
"""

import asyncio
import json
import websockets
import sys
from typing import Dict, Any


class ChatbotTestClient:
    """チャットボットテストクライアント"""
    
    def __init__(self, uri: str = "ws://localhost:8000/ws/test-client"):
        self.uri = uri
        self.websocket = None
        
    async def connect(self):
        """WebSocketに接続"""
        try:
            self.websocket = await websockets.connect(self.uri)
            print(f"✅ 接続成功: {self.uri}")
            return True
        except Exception as e:
            print(f"❌ 接続失敗: {e}")
            return False
    
    async def send_message(self, message_type: str, data: str):
        """メッセージを送信"""
        if not self.websocket:
            print("❌ WebSocket未接続")
            return
            
        message = {
            "type": message_type,
            "data": data
        }
        
        try:
            await self.websocket.send(json.dumps(message, ensure_ascii=False))
            print(f"📤 送信: {message}")
        except Exception as e:
            print(f"❌ 送信エラー: {e}")
    
    async def listen_for_messages(self):
        """メッセージを受信"""
        if not self.websocket:
            print("❌ WebSocket未接続")
            return
            
        try:
            while True:
                try:
                    message = await asyncio.wait_for(self.websocket.recv(), timeout=1.0)
                    
                    if isinstance(message, str):
                        # JSONメッセージ
                        try:
                            data = json.loads(message)
                            await self.handle_json_message(data)
                        except json.JSONDecodeError:
                            print(f"📥 テキスト: {message}")
                    else:
                        # バイナリメッセージ（音声データ）
                        print(f"📥 音声データ: {len(message)} bytes")
                        
                except asyncio.TimeoutError:
                    # タイムアウトは正常（ノンブロッキング処理のため）
                    continue
                except websockets.exceptions.ConnectionClosed:
                    print("🔌 接続が閉じられました")
                    break
                    
        except Exception as e:
            print(f"❌ 受信エラー: {e}")
    
    async def handle_json_message(self, data: Dict[str, Any]):
        """JSONメッセージを処理"""
        message_type = data.get("type", "unknown")
        message_data = data.get("data", "")
        
        if message_type == "connection":
            print(f"🔗 接続: {message_data}")
        elif message_type == "transcript_partial":
            print(f"🎤 途中: {message_data}")
        elif message_type == "transcript_final":
            print(f"🎤 確定: {message_data}")
        elif message_type == "chat_response":
            print(f"🤖 応答: {message_data.get('message', '')}")
            if message_data.get('recommendations'):
                print(f"📍 おすすめ: {len(message_data['recommendations'])}件")
        elif message_type == "speech_synthesis_start":
            print(f"🔊 音声合成開始: {message_data}")
        elif message_type == "speech_synthesis_complete":
            print(f"🔊 音声合成完了: {message_data}")
        elif message_type == "error":
            print(f"❌ エラー: {message_data}")
        else:
            print(f"📥 {message_type}: {message_data}")
    
    async def interactive_mode(self):
        """インタラクティブモード"""
        print("\n🎯 インタラクティブモード開始")
        print("   - 'quit' または 'exit' で終了")
        print("   - 'clear' で会話履歴クリア")
        print("   - 'history' で会話履歴表示")
        print("   - その他のテキストはチャットメッセージとして送信")
        print("-" * 50)
        
        # 受信用タスクを開始
        listen_task = asyncio.create_task(self.listen_for_messages())
        
        try:
            while True:
                try:
                    user_input = await asyncio.get_event_loop().run_in_executor(
                        None, input, "💬 入力: "
                    )
                    
                    if user_input.lower() in ['quit', 'exit', 'q']:
                        print("👋 終了します")
                        break
                    elif user_input.lower() == 'clear':
                        await self.send_message("clear_history", "")
                    elif user_input.lower() == 'history':
                        await self.send_message("get_history", "")
                    elif user_input.strip():
                        await self.send_message("chat", user_input)
                        
                except KeyboardInterrupt:
                    print("\n👋 Ctrl+C で終了します")
                    break
                except Exception as e:
                    print(f"❌ 入力エラー: {e}")
                    
        finally:
            listen_task.cancel()
            try:
                await listen_task
            except asyncio.CancelledError:
                pass
    
    async def run_tests(self):
        """自動テストを実行"""
        print("\n🧪 自動テスト開始")
        
        test_messages = [
            "こんにちは",
            "のんびりできる温泉旅行を教えて",
            "アクティブなスポーツ体験がしたい",
            "美味しいグルメを楽しみたい",
            "歴史的な場所を訪れたい",
            "自然豊かな場所でリフレッシュしたい",
            "家族で楽しめる場所を探している"
        ]
        
        # 受信用タスクを開始
        listen_task = asyncio.create_task(self.listen_for_messages())
        
        try:
            for i, message in enumerate(test_messages, 1):
                print(f"\n🎯 テスト {i}/{len(test_messages)}: {message}")
                await self.send_message("chat", message)
                
                # 応答を待機
                await asyncio.sleep(2)
                
        finally:
            listen_task.cancel()
            try:
                await listen_task
            except asyncio.CancelledError:
                pass
    
    async def close(self):
        """接続を閉じる"""
        if self.websocket:
            await self.websocket.close()
            print("🔌 接続を閉じました")


async def main():
    """メイン関数"""
    print("🎌 Tourism Chatbot WebSocket テストクライアント")
    print("=" * 60)
    
    client = ChatbotTestClient()
    
    # 接続
    if not await client.connect():
        sys.exit(1)
    
    try:
        if len(sys.argv) > 1 and sys.argv[1] == "test":
            # 自動テストモード
            await client.run_tests()
        else:
            # インタラクティブモード
            await client.interactive_mode()
    
    except KeyboardInterrupt:
        print("\n👋 プログラムを終了します")
    
    finally:
        await client.close()


if __name__ == "__main__":
    asyncio.run(main())