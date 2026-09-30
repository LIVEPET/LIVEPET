import warnings
from typing import List, Union
from pydantic import ValidationInfo, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "LivePet API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"

    # Conexão de Banco de Dados: SQLite local por padrão ou PostgreSQL
    DATABASE_URL: str = "sqlite:///./livepet.db"

    # Segurança e JWT
    SECRET_KEY: str = "livepet-local-dev-secret-key-12345"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 dia

    # Origens permitidas para CORS (restritas às origens do frontend)
    BACKEND_CORS_ORIGINS: Union[str, List[str]] = [
        "http://localhost:5173",
        "http://localhost:8080",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8080",
        "https://livepet-1.onrender.com",
        "https://livepet-web.onrender.com",
        "https://livepet.onrender.com",
    ]

    @field_validator("SECRET_KEY")
    def validate_secret_key(cls, v: str, info: ValidationInfo) -> str:
        env = (info.data.get("ENVIRONMENT") or "development").lower()
        # Em ambiente de produção, rejeita chaves fracas conhecidas ou de baixa entropia (< 32 chars)
        if env == "production":
            if "dev-secret" in v.lower() or len(v) < 32:
                raise ValueError(
                    "SECRET_KEY insegura para ambiente de produção! "
                    "Forneça uma chave de alta entropia com pelo menos 32 caracteres."
                )
        return v

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v == "*":
                return ["*"]
            if not v.startswith("["):
                return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return [
            "http://localhost:5173",
            "http://localhost:8080",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:8080",
            "https://livepet-1.onrender.com",
            "https://livepet-web.onrender.com",
            "https://livepet.onrender.com",
        ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow",
    )


settings = Settings()
