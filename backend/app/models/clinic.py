from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Clinic(Base):
    """
    Modelo de Clínica Veterinária do sistema LivePet (Issue #59).
    Armazena os dados cadastrais, credenciais de acesso e informações de atendimento.
    """
    __tablename__ = "clinics"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nome = Column(String(150), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    senha_hash = Column(String(255), nullable=False)
    crmv = Column(String(50), index=True, nullable=True)
    cnpj = Column(String(30), nullable=True)
    telefone = Column(String(30), nullable=True)
    whatsapp = Column(String(30), nullable=True)
    endereco = Column(String(255), nullable=True)
    sobre = Column(Text, nullable=True)
    foto_url = Column(String, nullable=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    atualizado_em = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relacionamento 1:N com Agendamentos / Atendimentos da Clínica
    appointments = relationship(
        "ClinicAppointment",
        back_populates="clinic",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Clinic id={self.id} nome='{self.nome}' email='{self.email}'>"
