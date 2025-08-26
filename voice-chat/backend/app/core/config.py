from typing import List, Optional
from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """アプリケーション設定クラス
    
    環境変数から設定を読み込み、デフォルト値を提供します。
    """
    
    # =====================================
    # AWS Configuration
    # =====================================
    aws_access_key_id: str = Field(..., description="AWS Access Key ID")
    aws_secret_access_key: str = Field(..., description="AWS Secret Access Key")
    aws_region: str = Field(default="ap-northeast-1", description="AWS Region")
    
    # =====================================
    # Application Configuration
    # =====================================
    app_name: str = Field(default="Tourism Chatbot Backend", description="Application name")
    app_version: str = Field(default="0.1.0", description="Application version")
    debug: bool = Field(default=False, description="Debug mode")
    host: str = Field(default="0.0.0.0", description="Server host")
    port: int = Field(default=8000, description="Server port")
    
    # =====================================
    # Audio Processing Configuration
    # =====================================
    audio_sample_rate: int = Field(default=16000, description="Audio sample rate for Transcribe")
    audio_chunk_size: int = Field(default=1024, description="Audio chunk size")
    language_code: str = Field(default="ja-JP", description="Language code for speech recognition")
    
    # =====================================
    # Polly Configuration
    # =====================================
    polly_voice_id: str = Field(default="Takumi", description="Polly voice ID for Japanese")
    polly_output_format: str = Field(default="mp3", description="Polly output format")
    polly_sample_rate: str = Field(default="22050", description="Polly sample rate")
    
    # =====================================
    # LangChain Configuration
    # =====================================
    anthropic_api_key: Optional[str] = Field(default=None, description="Anthropic API key")
    openai_api_key: Optional[str] = Field(default=None, description="OpenAI API key")
    
    # =====================================
    # Logging Configuration
    # =====================================
    log_level: str = Field(default="INFO", description="Logging level")
    log_format: str = Field(
        default="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        description="Log format"
    )
    
    # =====================================
    # WebSocket Configuration
    # =====================================
    websocket_timeout: int = Field(default=300, description="WebSocket timeout in seconds")
    max_websocket_connections: int = Field(default=100, description="Maximum WebSocket connections")
    
    # =====================================
    # CORS Configuration
    # =====================================
    cors_origins: str = Field(
        default="http://localhost:3000,http://localhost:3001",
        description="Allowed CORS origins (comma-separated)"
    )
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        
    def get_cors_origins(self) -> List[str]:
        """CORS origins のリストを取得
        
        環境変数からカンマ区切りの文字列を読み込んでリストに変換
        """
        return [origin.strip() for origin in self.cors_origins.split(",")]
    
    @property
    def aws_config(self) -> dict:
        """AWS設定を辞書形式で取得"""
        return {
            "aws_access_key_id": self.aws_access_key_id,
            "aws_secret_access_key": self.aws_secret_access_key,
            "region_name": self.aws_region,
        }
    
    @property
    def transcribe_config(self) -> dict:
        """Transcribe設定を辞書形式で取得"""
        return {
            "language_code": self.language_code,
            "sample_rate": self.audio_sample_rate,
            "chunk_size": self.audio_chunk_size,
        }
    
    @property
    def polly_config(self) -> dict:
        """Polly設定を辞書形式で取得"""
        return {
            "voice_id": self.polly_voice_id,
            "output_format": self.polly_output_format,
            "sample_rate": self.polly_sample_rate,
        }


# グローバル設定インスタンス
settings = Settings()