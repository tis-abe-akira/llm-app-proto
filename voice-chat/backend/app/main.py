import asyncio
import json
import logging
from typing import Dict, Set
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from websockets.exceptions import ConnectionClosedError
import uvicorn

from app.core.config import settings
from app.services.aws_services import aws_service_manager
from app.services.chat_service import chat_service

# ログ設定
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format=settings.log_format
)

# AWS関連のログレベルを調整（内部エラーを抑制）
logging.getLogger('awscrt').setLevel(logging.CRITICAL)
logging.getLogger('amazon_transcribe').setLevel(logging.WARNING)
logging.getLogger('botocore').setLevel(logging.WARNING)
logging.getLogger('boto3').setLevel(logging.WARNING)

logger = logging.getLogger(__name__)


class ConnectionManager:
    """WebSocket接続管理クラス"""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.client_tasks: Dict[str, Set[asyncio.Task]] = {}
        
    async def connect(self, websocket: WebSocket, client_id: str):
        """クライアント接続"""
        await websocket.accept()
        self.active_connections[client_id] = websocket
        self.client_tasks[client_id] = set()
        logger.info(f"Client {client_id} connected. Total connections: {len(self.active_connections)}")
    
    def disconnect(self, client_id: str):
        """クライアント切断"""
        if client_id in self.active_connections:
            del self.active_connections[client_id]
            
        # 関連するタスクをキャンセル
        if client_id in self.client_tasks:
            for task in self.client_tasks[client_id]:
                if not task.done():
                    task.cancel()
            del self.client_tasks[client_id]
            
        logger.info(f"Client {client_id} disconnected. Total connections: {len(self.active_connections)}")
    
    async def send_personal_message(self, message: dict, client_id: str):
        """個別メッセージ送信"""
        if client_id in self.active_connections:
            websocket = self.active_connections[client_id]
            try:
                if message.get("type") == "audio":
                    # 音声データはバイナリとして送信
                    await websocket.send_bytes(message["data"])
                else:
                    # テキストデータはJSONとして送信
                    await websocket.send_text(json.dumps(message, ensure_ascii=False))
            except Exception as e:
                logger.error(f"Error sending message to {client_id}: {e}")
                self.disconnect(client_id)
    
    def add_task(self, client_id: str, task: asyncio.Task):
        """クライアントタスクを追加"""
        if client_id in self.client_tasks:
            self.client_tasks[client_id].add(task)


# アプリケーションライフサイクル管理
@asynccontextmanager
async def lifespan(app: FastAPI):
    """アプリケーション起動・終了時の処理"""
    # 起動時の処理
    logger.info("Starting Tourism Chatbot Backend...")
    try:
        await aws_service_manager.initialize_services()
        logger.info("AWS services initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize AWS services: {e}")
        raise
    
    yield
    
    # 終了時の処理
    logger.info("Shutting down Tourism Chatbot Backend...")


# FastAPIアプリケーション作成
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    debug=settings.debug,
    lifespan=lifespan
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# 接続マネージャー
manager = ConnectionManager()


@app.get("/")
async def root():
    """ルートエンドポイント"""
    return {
        "message": "Tourism Chatbot Backend API",
        "version": settings.app_version,
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """ヘルスチェックエンドポイント"""
    try:
        aws_health = await aws_service_manager.health_check()
        return {
            "status": "healthy",
            "aws_services": aws_health,
            "active_connections": len(manager.active_connections)
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail="Service unavailable")


@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """WebSocket メインエンドポイント"""
    await manager.connect(websocket, client_id)
    
    websocket_queue = asyncio.Queue()
    
    try:
        # WebSocketキューの処理タスク
        queue_task = asyncio.create_task(
            process_websocket_queue(websocket_queue, client_id)
        )
        manager.add_task(client_id, queue_task)
        
        # 初期接続メッセージ
        await manager.send_personal_message({
            "type": "connection",
            "data": "接続完了"
        }, client_id)
        
        while True:
            try:
                # WebSocket接続状態をチェック
                if websocket.client_state.name == "DISCONNECTED":
                    logger.info(f"WebSocket already disconnected for client {client_id}")
                    break
                
                # WebSocketからデータを受信
                data = await websocket.receive()
                
                # 切断メッセージを受信した場合
                if data.get("type") == "websocket.disconnect":
                    logger.info(f"Received disconnect message for client {client_id}")
                    break
                
                if "text" in data:
                    # テキストメッセージの場合
                    message = json.loads(data["text"])
                    await handle_text_message(message, client_id)
                    
                elif "bytes" in data:
                    # 音声データ受信（現在は使用しない - Web Speech API使用中）
                    logger.debug(f"Received audio chunk: {len(data['bytes'])} bytes (ignored - using Web Speech API)")
                
            except WebSocketDisconnect:
                logger.info(f"WebSocket disconnected for client {client_id}")
                break
            except ConnectionClosedError:
                logger.info(f"WebSocket connection closed for client {client_id}")
                break
            except RuntimeError as e:
                if "Cannot call \"receive\" once a disconnect message has been received" in str(e):
                    logger.info(f"WebSocket disconnect message already received for client {client_id}")
                    break
                else:
                    logger.error(f"Runtime error for client {client_id}: {e}")
                    break
            except json.JSONDecodeError as e:
                logger.error(f"JSON decode error for client {client_id}: {e}")
                # 切断されていない場合のみエラーメッセージを送信
                if client_id in manager.active_connections:
                    await manager.send_personal_message({
                        "type": "error",
                        "data": "メッセージの形式が正しくありません"
                    }, client_id)
            except Exception as e:
                logger.error(f"Error processing message for client {client_id}: {e}")
                # 切断されていない場合のみエラーメッセージを送信
                if client_id in manager.active_connections:
                    await manager.send_personal_message({
                        "type": "error",
                        "data": f"メッセージ処理エラー: {str(e)}"
                    }, client_id)
                break
    
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected during setup for client {client_id}")
    except Exception as e:
        logger.error(f"WebSocket error for client {client_id}: {e}")
        # 切断されていない場合のみエラーメッセージを送信
        if client_id in manager.active_connections:
            await manager.send_personal_message({
                "type": "error",
                "data": f"接続エラーが発生しました: {str(e)}"
            }, client_id)
    
    finally:
        # クリーンアップ
        manager.disconnect(client_id)


async def handle_text_message(message: dict, client_id: str):
    """テキストメッセージの処理"""
    message_type = message.get("type")
    
    if message_type == "chat":
        # チャットメッセージ
        user_input = message.get("data", "")
        if user_input:
            await process_chat_message(user_input, client_id)
    
    elif message_type == "clear_history":
        # 会話履歴クリア
        chat_service.clear_conversation_history()
        await manager.send_personal_message({
            "type": "system",
            "data": "会話履歴をクリアしました"
        }, client_id)
    
    elif message_type == "get_history":
        # 会話履歴取得
        history = chat_service.get_conversation_history()
        await manager.send_personal_message({
            "type": "history",
            "data": history
        }, client_id)

async def process_websocket_queue(queue: asyncio.Queue, client_id: str):
    """WebSocketキューの処理"""
    try:
        while True:
            try:
                # タイムアウト付きでキューから取得
                message = await asyncio.wait_for(queue.get(), timeout=1.0)
                logger.debug(f"Received message from queue for client {client_id}: {message}")
                
                # クライアントが切断されていないか確認
                if client_id not in manager.active_connections:
                    logger.info(f"Client {client_id} disconnected, stopping queue processing")
                    break
                
                if message.get("type") == "transcript_final":
                    # 最終的な文字起こし結果を受信
                    transcript = message.get("data", "")
                    if transcript.strip():
                        # チャット処理を実行
                        await process_chat_message(transcript, client_id)
                
                # そのままクライアントに転送
                logger.debug(f"Sending message to client {client_id}: {message}")
                await manager.send_personal_message(message, client_id)
                
            except asyncio.TimeoutError:
                # タイムアウト時に接続状態をチェック
                if client_id not in manager.active_connections:
                    logger.info(f"Client {client_id} no longer active, stopping queue processing")
                    break
                continue
                
    except asyncio.CancelledError:
        logger.info(f"WebSocket queue processing cancelled for client {client_id}")
    except Exception as e:
        logger.error(f"Error processing WebSocket queue for client {client_id}: {e}")
    finally:
        # キューに残っているメッセージを破棄
        while not queue.empty():
            try:
                queue.get_nowait()
            except asyncio.QueueEmpty:
                break

async def process_chat_message(user_input: str, client_id: str):
    """チャットメッセージの処理"""
    try:
        # チャットサービスで応答を生成
        response = await chat_service.generate_response(user_input, client_id)
        
        # テキスト応答を送信
        await manager.send_personal_message({
            "type": "chat_response",
            "data": response
        }, client_id)
        
        # 音声合成してクライアントに送信
        response_text = response["message"]
        if response_text:
            await synthesize_and_send_speech(response_text, client_id)
    
    except Exception as e:
        logger.error(f"Error processing chat message for client {client_id}: {e}")
        await manager.send_personal_message({
            "type": "error",
            "data": "チャット処理中にエラーが発生しました"
        }, client_id)


def normalize_text_for_speech(text: str) -> str:
    """音声合成用にテキストを正規化"""
    # 「〜」を「から」に置換
    normalized = text.replace("〜", "から")
    return normalized


async def synthesize_and_send_speech(text: str, client_id: str):
    """音声合成して送信"""
    try:
        # 音声合成を開始の通知
        await manager.send_personal_message({
            "type": "speech_synthesis_start",
            "data": "音声を生成中..."
        }, client_id)
        
        # テキストを音声用に正規化
        normalized_text = normalize_text_for_speech(text)
        
        # Pollyで音声合成
        audio_data = await aws_service_manager.polly_service.synthesize_speech(normalized_text)
        
        # 音声データを送信
        await manager.send_personal_message({
            "type": "audio",
            "data": audio_data
        }, client_id)
        
        # 音声合成完了の通知
        await manager.send_personal_message({
            "type": "speech_synthesis_complete",
            "data": "音声の生成が完了しました"
        }, client_id)
        
    except Exception as e:
        logger.error(f"Error synthesizing speech for client {client_id}: {e}")
        await manager.send_personal_message({
            "type": "error",
            "data": "音声合成中にエラーが発生しました"
        }, client_id)


@app.get("/connections")
async def get_connections():
    """アクティブな接続数を取得"""
    return {
        "active_connections": len(manager.active_connections),
        "client_ids": list(manager.active_connections.keys())
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level=settings.log_level.lower()
    )
