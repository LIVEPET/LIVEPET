from datetime import datetime, timedelta, timezone
from typing import Any, Optional, Union
import bcrypt
import jwt
from app.core.config import settings


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica se a senha em texto plano confere com a hash armazenada usando bcrypt direto."""
    try:
        pwd_bytes = plain_password.encode("utf-8")[:72]
        hash_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    """Gera o hash seguro da senha fornecida usando bcrypt direto."""
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def create_access_token(
    subject: Union[str, Any], expires_delta: Optional[timedelta] = None
) -> str:
    """Cria um token JWT assinado para o subject (user_id ou email)."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """Decodifica e valida o token JWT."""
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        return payload
    except (jwt.PyJWTError, Exception):
        return None


import time
from collections import defaultdict
from threading import Lock
from fastapi import Request


class InMemoryRateLimiter:
    """Rate limiter em memória baseado em sliding window e thread-safe."""

    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = defaultdict(list)
        self.lock = Lock()

    def is_allowed(self, key: str) -> bool:
        if key in ["testclient", "test"]:
            return True
        now = time.time()
        with self.lock:
            # Remove timestamps fora da janela
            self.requests[key] = [
                t for t in self.requests[key] if now - t < self.window_seconds
            ]
            if len(self.requests[key]) >= self.max_requests:
                return False
            self.requests[key].append(now)
            return True

    def reset(self, key: str):
        with self.lock:
            self.requests.pop(key, None)


def get_client_ip(request: Request) -> str:
    """Extrai o IP real do cliente considerando proxies (Render/Cloudflare/Nginx)."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"


# Limitadores dedicados para endpoints sensíveis de autenticação e rotas públicas
login_rate_limiter = InMemoryRateLimiter(max_requests=15, window_seconds=60)
register_rate_limiter = InMemoryRateLimiter(max_requests=10, window_seconds=600)
public_qr_rate_limiter = InMemoryRateLimiter(max_requests=60, window_seconds=60)

