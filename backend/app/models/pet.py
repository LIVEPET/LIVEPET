import uuid
from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Pet(Base):
    """
    Modelo de Pet do sistema LivePet.
    """
    __tablename__ = "pets"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    nome = Column(String(100), nullable=False)
    especie = Column(String(50), nullable=False)
    raca = Column(String(80), nullable=True)
    porte = Column(String(20), nullable=True)
    sexo = Column(String(20), nullable=True)
    data_nascimento = Column(Date, nullable=True)
    cor = Column(String(80), nullable=True)
    peso = Column(Float, nullable=True)
    foto_url = Column(String(500), nullable=True)
    token_publico = Column(
        String(64),
        unique=True,
        index=True,
        nullable=False,
        default=lambda: uuid.uuid4().hex,
    )

    # Relacionamento N:1 com User (Tutor)
    tutor = relationship("User", back_populates="pets")

    # Relacionamentos 1:N com Vacinas e Prontuários Médicos
    vaccines = relationship(
        "Vaccine",
        back_populates="pet",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    medical_records = relationship(
        "MedicalRecord",
        back_populates="pet",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Pet id={self.id} nome='{self.nome}' especie='{self.especie}'>"
