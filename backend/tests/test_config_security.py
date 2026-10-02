import pytest
from pydantic import ValidationError
from app.core.config import Settings


def test_config_dev_environment_defaults():
    """Valida que em ambiente de desenvolvimento o Settings inicializa corretamente.

    Passa BACKEND_CORS_ORIGINS explicitamente para evitar interferência do .env local.
    O default do código inclui URLs de produção, mas o .env pode sobrescrever isso.
    """
    cors_origins = (
        "http://localhost:5173,"
        "http://localhost:8080,"
        "https://livepet-web.onrender.com,"
        "https://livepet-1.onrender.com"
    )
    cfg = Settings(
        ENVIRONMENT="development",
        SECRET_KEY="livepet-local-dev-secret-key-12345",
        BACKEND_CORS_ORIGINS=cors_origins,
    )
    assert cfg.ENVIRONMENT == "development"
    assert "https://livepet-web.onrender.com" in cfg.BACKEND_CORS_ORIGINS
    assert "http://localhost:5173" in cfg.BACKEND_CORS_ORIGINS
    assert "*" not in cfg.BACKEND_CORS_ORIGINS


def test_config_production_rejects_weak_secret_key():
    """Valida que em produção uma SECRET_KEY fraca ou padrão é bloqueada por validação."""
    with pytest.raises(ValidationError) as exc_info:
        Settings(
            ENVIRONMENT="production",
            SECRET_KEY="livepet-local-dev-secret-key-12345",
        )
    assert "SECRET_KEY insegura para ambiente de produção" in str(exc_info.value)


def test_config_production_rejects_default_env_secret_key():
    """Valida que o valor default do .env é rejeitado em produção mesmo tendo mais de 32 chars."""
    with pytest.raises(ValidationError) as exc_info:
        Settings(
            ENVIRONMENT="production",
            SECRET_KEY="livepet-super-secret-key-change-in-production",
        )
    assert "SECRET_KEY insegura para ambiente de produção" in str(exc_info.value)


def test_config_production_rejects_short_secret_key():
    """Valida que em produção uma SECRET_KEY com menos de 32 caracteres é rejeitada."""
    with pytest.raises(ValidationError) as exc_info:
        Settings(
            ENVIRONMENT="production",
            SECRET_KEY="chave-muito-curta",
        )
    assert "SECRET_KEY insegura para ambiente de produção" in str(exc_info.value)


def test_config_production_accepts_strong_secret_key():
    """Valida que em produção uma chave segura de 32+ caracteres é aceita."""
    strong_key = "a" * 32
    cfg = Settings(
        ENVIRONMENT="production",
        SECRET_KEY=strong_key,
        BACKEND_CORS_ORIGINS="https://livepet-web.onrender.com,https://livepet-1.onrender.com",
    )
    assert cfg.SECRET_KEY == strong_key
    assert len(cfg.BACKEND_CORS_ORIGINS) == 2
    assert "https://livepet-web.onrender.com" in cfg.BACKEND_CORS_ORIGINS


def test_cors_origins_parsing():
    """Valida o parser de origens CORS a partir de string separada por vírgula."""
    cfg = Settings(
        ENVIRONMENT="development",
        BACKEND_CORS_ORIGINS="http://localhost:3000, https://meusite.com",
    )
    assert cfg.BACKEND_CORS_ORIGINS == ["http://localhost:3000", "https://meusite.com"]
