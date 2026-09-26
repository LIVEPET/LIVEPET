from typing import Generator
from sqlalchemy.orm import Session
from app.core.database import get_db

# Re-exporta dependências comuns da API
__all__ = ["get_db"]
