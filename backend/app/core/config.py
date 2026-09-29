from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "LivePet API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Conexão de Banco de Dados: SQLite local por padrão ou PostgreSQL
    DATABASE_URL: str = "sqlite:///./livepet.db"

    # Segurança e JWT
    SECRET_KEY: str = "livepet-local-dev-secret-key-12345"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 dia

    # Origens permitidas para CORS ("*" = qualquer origem, seguro para MVP)
    BACKEND_CORS_ORIGINS: Union[str, List[str]] = "*"

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v == "*":
                return ["*"]
            if not v.startswith("["):
                return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return ["*"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow",
    )


settings = Settings()
