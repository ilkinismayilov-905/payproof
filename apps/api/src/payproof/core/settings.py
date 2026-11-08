from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

_API_DIR = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    # .env lives at the repo root (scripts/setup.sh); apps/api/.env overrides it. CWD-independent.
    model_config = SettingsConfigDict(
        env_file=(_API_DIR.parents[1] / ".env", _API_DIR / ".env"), extra="ignore"
    )

    env: Literal["dev", "test", "prod"] = "dev"
    log_level: str = "INFO"
    database_url: str
    jwt_secret: SecretStr
    s3_endpoint_url: str
    s3_access_key: str
    s3_secret_key: SecretStr
    s3_bucket: str
    ai_provider: Literal["mock", "pdf", "llm"] = "mock"


@lru_cache
def get_settings() -> Settings:
    return Settings()
