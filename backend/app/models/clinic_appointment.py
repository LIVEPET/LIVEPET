from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class ClinicAppointment(Base):
    """
    Modelo de Agendamento / Atendimento Clínico (Issue #59).
    Armazena os dados dos atendimentos agendados ou realizados pela clínica parceira,
    incluindo anamnese, exame físico e desfecho clínico.
    """
    __tablename__ = "clinic_appointments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    clinic_id = Column(
        Integer,
        ForeignKey("clinics.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    pet_id = Column(
        Integer,
        ForeignKey("pets.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    pet_name = Column(String(100), nullable=False)
    species = Column(String(50), nullable=False)
    breed = Column(String(80), nullable=True, default="—")
    tutor = Column(String(100), nullable=False)
    phone = Column(String(30), nullable=False)
    service = Column(String(100), nullable=False)
    vet = Column(String(100), nullable=True, default="Equipe da clínica")
    date = Column(String(10), nullable=False)  # Formato YYYY-MM-DD
    time = Column(String(10), nullable=False)  # Formato HH:MM
    status = Column(String(30), nullable=False, default="Confirmado")
    notes = Column(Text, nullable=True)

    # Campos de Exame Clínico e Anamnese
    queixa_principal = Column(Text, nullable=True)
    temperatura = Column(Float, nullable=True)  # Em °C
    peso = Column(Float, nullable=True)  # Em kg
    frequencia_cardiaca = Column(Integer, nullable=True)  # Em bpm
    frequencia_respiratoria = Column(Integer, nullable=True)  # Em mpm
    mucosas = Column(String(50), nullable=True)
    diagnostico = Column(Text, nullable=True)
    prescricao = Column(Text, nullable=True)

    # Registro rápido de vacina aplicada durante o atendimento
    vacina_aplicada = Column(String(100), nullable=True)
    vacina_lote = Column(String(50), nullable=True)
    vacina_proxima_dose = Column(String(10), nullable=True)

    criado_em = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    atualizado_em = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relacionamento N:1 com Clinic
    clinic = relationship("Clinic", back_populates="appointments")
    # Relacionamento N:1 opcional com Pet oficial
    pet = relationship("Pet", backref="clinic_appointments")

    def __repr__(self) -> str:
        return f"<ClinicAppointment id={self.id} pet='{self.pet_name}' date='{self.date}' time='{self.time}' status='{self.status}'>"

