import asyncio
import logging
from typing import AsyncGenerator, Dict, Any
from io import BytesIO

import boto3
from botocore.exceptions import ClientError, NoCredentialsError

from app.core.config import settings

logger = logging.getLogger(__name__)


class PollyService:
    """AWS Polly テキスト読み上げサービス"""
    
    def __init__(self):
        self.client = None
        self.config = settings.polly_config
        self.aws_config = settings.aws_config
        
    def initialize_client(self):
        """Pollyクライアントを初期化"""
        try:
            self.client = boto3.client('polly', **self.aws_config)
            logger.info("Polly client initialized successfully")
        except NoCredentialsError:
            logger.error("AWS credentials not found")
            raise
        except Exception as e:
            logger.error(f"Failed to initialize Polly client: {e}")
            raise
    
    async def synthesize_speech(self, text: str) -> bytes:
        """テキストを音声に変換"""
        if not self.client:
            self.initialize_client()
            
        try:
            # 非同期でPollyを呼び出し
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                self._synthesize_speech_sync,
                text
            )
            
            # 音声データを取得
            audio_stream = response['AudioStream'].read()
            logger.info(f"Synthesized speech for text: {text[:50]}...")
            
            return audio_stream
            
        except ClientError as e:
            logger.error(f"AWS Polly error: {e}")
            raise
        except Exception as e:
            logger.error(f"Failed to synthesize speech: {e}")
            raise
    
    def _synthesize_speech_sync(self, text: str) -> Dict[str, Any]:
        """同期的な音声合成（エグゼキューターで実行）"""
        return self.client.synthesize_speech(
            Text=text,
            OutputFormat=self.config["output_format"],
            VoiceId=self.config["voice_id"],
            SampleRate=self.config["sample_rate"],
            Engine='neural'  # より自然な音声のためneuralエンジンを使用
        )
    
    async def synthesize_speech_streaming(self, text: str) -> AsyncGenerator[bytes, None]:
        """ストリーミング形式で音声を生成"""
        try:
            audio_data = await self.synthesize_speech(text)
            
            # チャンクに分割してストリーミング
            chunk_size = 4096
            audio_io = BytesIO(audio_data)
            
            while True:
                chunk = audio_io.read(chunk_size)
                if not chunk:
                    break
                yield chunk
                
        except Exception as e:
            logger.error(f"Failed to stream speech: {e}")
            raise
    
    async def get_available_voices(self, language_code: str = "ja-JP") -> list[Dict[str, Any]]:
        """利用可能な音声一覧を取得"""
        if not self.client:
            self.initialize_client()
            
        try:
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: self.client.describe_voices(LanguageCode=language_code)
            )
            
            return response['Voices']
            
        except Exception as e:
            logger.error(f"Failed to get available voices: {e}")
            raise


class AWSServiceManager:
    """AWS サービス管理クラス"""
    
    def __init__(self):
        self.polly_service = PollyService()
        
    async def initialize_services(self):
        """AWSサービスを初期化（Pollyのみ）"""
        try:
            self.polly_service.initialize_client()
            logger.info("AWS Polly service initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize AWS services: {e}")
            raise
    
    async def health_check(self) -> Dict[str, str]:
        """AWSサービスの健全性をチェック"""
        health_status = {
            "polly": "unknown"
        }
        
        try:
            # Pollyの確認
            if self.polly_service.client:
                # 簡単なテスト音声合成
                await self.polly_service.synthesize_speech("テスト")
                health_status["polly"] = "healthy"
            else:
                health_status["polly"] = "not_initialized"
                
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            if "polly" in str(e).lower():
                health_status["polly"] = "error"
        
        return health_status


# グローバルサービスマネージャーインスタンス
aws_service_manager = AWSServiceManager()