"""Configuration management for the Dummy Chat API.

This module handles application settings using Pydantic BaseSettings,
loading configuration from environment variables and .env file.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application configuration settings.
    
    Loads configuration from environment variables and .env file.
    This is a dummy implementation that doesn't require OpenAI API keys.
    
    Attributes:
        cors_origins: List of allowed CORS origins for frontend access.
        dummy_mode: Flag indicating this is a dummy service.
    """
    cors_origins: list[str] = ["http://localhost:5173"]
    dummy_mode: bool = True
    
    class Config:
        """Pydantic configuration for settings loading."""
        env_file = ".env"


settings = Settings()
