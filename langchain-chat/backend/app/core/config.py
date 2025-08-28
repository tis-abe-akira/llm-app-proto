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
        cors_origins: List of allowed CORS origins for frontend access.
    """
    openai_api_key: str = ""
    openai_model: str = "gpt-4o"
    cors_origins: list[str] = ["http://localhost:5173"]
    
    class Config:
        """Pydantic configuration for settings loading."""
        env_file = ".env"


settings = Settings()
