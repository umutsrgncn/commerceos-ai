from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    gemini_api_key: str = Field(..., alias="GEMINI_API_KEY")
    gemini_model: str = Field("gemini-2.5-flash", alias="GEMINI_MODEL")
    redis_url: str = Field("redis://localhost:6379", alias="REDIS_URL")
    log_level: str = Field("info", alias="LOG_LEVEL")

    # Read-only Postgres DSN for the natural-language query tool.
    readonly_database_url: str = Field(
        "postgresql://commerceos_readonly:readonly_pwd_2026@localhost:5432/commerceos",
        alias="READONLY_DATABASE_URL",
    )
    # Hard caps for query_database tool to keep cost/latency bounded.
    query_max_rows: int = Field(200, alias="QUERY_MAX_ROWS")
    query_timeout_seconds: float = Field(8.0, alias="QUERY_TIMEOUT_SECONDS")


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
