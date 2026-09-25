from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class MedicalRecord(Base):
    """
    Modelo de Registro / Histórico Médico de um Pet.
    """
    __tablename__ = "medical_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    pet_id = Column(
        Integer,
        ForeignKey("pets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    tipo = Column(String(50), nullable=False)
    descricao = Column(Text, nullable=True)
    peso_registrado = Column(Float, nullable=True)
    data_registro = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relacionamento N:1 com Pet
    pet = relationship("Pet", back_populates="medical_records")

    def __repr__(self) -> str:
        return f"<MedicalRecord id={self.id} tipo='{self.tipo}' pet_id={self.pet_id}>"
