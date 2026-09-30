from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class CareContact(Base):
    """
    Modelo de Contato da Rede de Cuidados / Emergência vinculado a um Pet.
    """
    __tablename__ = "care_contacts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    pet_id = Column(
        Integer,
        ForeignKey("pets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    nome = Column(String(150), nullable=False)
    funcao = Column(String(100), nullable=False)  # Ex: Tutora Principal, Veterinária, Pet Sitter, Passeador
    categoria = Column(String(50), nullable=False, default="emergency")  # 'emergency' ou 'care'
    telefone = Column(String(50), nullable=False)
    email = Column(String(255), nullable=True)
    foto_url = Column(String(500), nullable=True)
    relacao_tutor = Column(String(100), nullable=True)  # Ex: Própria, Irmão da tutora, Profissional contratado
    relacao_pet = Column(String(100), nullable=True)  # Ex: Tutora desde filhote, Veterinária desde 2022
    nivel_vinculo = Column(String(50), nullable=True, default="Alto")  # Muito Alto, Alto, Médio, Baixo
    observacoes = Column(Text, nullable=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relacionamento N:1 com Pet
    pet = relationship("Pet", back_populates="care_contacts")

    def __repr__(self) -> str:
        return f"<CareContact id={self.id} nome='{self.nome}' pet_id={self.pet_id}>"
