"""Configuration management for the LangChain Chat API.

This module handles application settings using Pydantic BaseSettings,
loading configuration from environment variables and .env file.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application configuration settings.
    
    Loads configuration from environment variables and .env file.
    
    Attributes:
        openai_api_key: OpenAI API key for LLM access.
        openai_model: OpenAI model identifier to use (default: gpt-4o).
        aws_region: AWS region for Bedrock.
        aws_access_key_id: AWS access key ID.
        aws_secret_access_key: AWS secret access key.
        bedrock_model_id: Bedrock model identifier.
        llm_provider: LLM provider to use (openai or bedrock).
        cors_origins: List of allowed CORS origins for frontend access.
    """
    # OpenAI設定
    openai_api_key: str = ""
    openai_model: str = "gpt-4o"
    
    # AWS Bedrock設定
    aws_region: str = "us-east-1"
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    bedrock_model_id: str = "us.anthropic.claude-3-7-sonnet-20250219-v1:0"
    
    # プロバイダー選択
    llm_provider: str = "openai"  # "openai" or "bedrock"
    
    cors_origins: list[str] = ["http://localhost:5173"]
    
    class Config:
        """Pydantic configuration for settings loading."""
        env_file = ".env"


settings = Settings()
