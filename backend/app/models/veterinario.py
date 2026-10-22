from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Veterinario(Base):
    """
    Modelo de Veterinário do sistema LivePet (Issue #53).
    Representa o profissional de medicina veterinária vinculado a uma clínica parceira,
    habilitado para realizar consultas, emitir laudos, aplicar vacinas e assinar pedigrees.
    """
    __tablename__ = "veterinarios"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    clinic_id = Column(
        Integer,
        ForeignKey("clinics.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    nome = Column(String(150), nullable=False)
    crmv = Column(String(50), nullable=False, index=True)
    especialidade = Column(String(100), nullable=True)
    telefone = Column(String(30), nullable=True)
    email = Column(String(255), nullable=True)
    ativo = Column(Boolean, default=True, nullable=False)
    criado_em = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    atualizado_em = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relacionamento N:1 com Clinic
    clinic = relationship("Clinic", back_populates="veterinarios")

    def __repr__(self) -> str:
        return f"<Veterinario id={self.id} nome='{self.nome}' crmv='{self.crmv}'>"
