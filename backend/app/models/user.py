import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class User(Base):
    """
    Modelo de Usuário / Tutor do sistema LivePet.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nome = Column(String(150), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    senha_hash = Column(String(255), nullable=False)
    telefone = Column(String(20), nullable=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relacionamento 1:N com Pets
    pets = relationship(
        "Pet",
        back_populates="tutor",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} email='{self.email}'>"
