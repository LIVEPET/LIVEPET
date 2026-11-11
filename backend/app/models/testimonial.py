from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    false,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Testimonial(Base):
    """Depoimento de um tutor real, exibido na landing só depois de aprovado."""

    __tablename__ = "testimonials"
    __table_args__ = (
        UniqueConstraint("user_id", name="uq_testimonials_user"),
    )

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    texto = Column(String(280), nullable=False)
    aprovado = Column(Boolean, nullable=False, default=False, server_default=false())
    criado_em = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relacionamento N:1 com User (Tutor), usado para mostrar o nome
    tutor = relationship("User")