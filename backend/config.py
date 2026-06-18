"""
Application configuration using Pydantic BaseSettings.
All values are loaded from environment variables or .env file.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # OpenAI
    OPENAI_API_KEY: str = "sk-proj-placeholder"

    # Supabase
    SUPABASE_URL: str = "https://placeholder.supabase.co"
    SUPABASE_SERVICE_ROLE_KEY: str = "placeholder"

    # Clerk
    CLERK_SECRET_KEY: str = "sk_live_placeholder"
    CLERK_JWKS_URL: str = "https://placeholder.clerk.accounts.dev/.well-known/jwks.json"

    # Encryption
    POSTGRES_ENCRYPTION_KEY: str = "0" * 64  # 32-byte hex string

    # App Config
    ENVIRONMENT: str = "development"
    ALLOWED_ORIGINS: str = "http://localhost:3000"
    MAX_UPLOAD_SIZE_MB: int = 50
    DOCKER_EXECUTION_TIMEOUT_SECONDS: int = 30
    MAX_RETRY_ATTEMPTS: int = 3
    DATA_CACHE_DIR: str = "/tmp/data_cache"

    # E2B Cloud Sandbox
    E2B_API_KEY: str = ""
    SANDBOX_EXECUTION_TIMEOUT_SECONDS: int = 30

    # Legacy Docker Sandbox — conservative limits to protect host system
    SANDBOX_IMAGE_NAME: str = "data-sandbox:latest"
    SANDBOX_MEMORY_LIMIT: str = "256m"
    SANDBOX_CPU_LIMIT: float = 0.5

    @property
    def allowed_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
