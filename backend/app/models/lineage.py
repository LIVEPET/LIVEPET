from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Lineage(Base):
    """
    Modelo de Linhagem e Pedigree oficial vinculado a um Pet.
    """
    __tablename__ = "lineages"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    pet_id = Column(
        Integer,
        ForeignKey("pets.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    registro = Column(String(100), nullable=True)  # Ex: CBKC nº 4521987
    generacoes = Column(Integer, default=3, nullable=False)
    pai_pet_id = Column(Integer, ForeignKey("pets.id", ondelete="SET NULL"), nullable=True)
    mae_pet_id = Column(Integer, ForeignKey("pets.id", ondelete="SET NULL"), nullable=True)
    status_verificacao = Column(String(50), default="declaratorio", nullable=False)
    pai_nome = Column(String(150), nullable=True)
    pai_registro = Column(String(100), nullable=True)
    pai_titulos = Column(String(200), nullable=True)
    mae_nome = Column(String(150), nullable=True)
    mae_registro = Column(String(100), nullable=True)
    mae_titulos = Column(String(200), nullable=True)
    avo_pat_m_nome = Column(String(150), nullable=True)  # Avô paterno
    avo_pat_m_registro = Column(String(100), nullable=True)
    avo_pat_f_nome = Column(String(150), nullable=True)  # Avó paterna
    avo_pat_f_registro = Column(String(100), nullable=True)
    avo_mat_m_nome = Column(String(150), nullable=True)  # Avô materno
    avo_mat_m_registro = Column(String(100), nullable=True)
    avo_mat_f_nome = Column(String(150), nullable=True)  # Avó materna
    avo_mat_f_registro = Column(String(100), nullable=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relacionamento 1:1 com Pet
    pet = relationship("Pet", back_populates="lineage", foreign_keys=[pet_id])
    pai = relationship("Pet", foreign_keys=[pai_pet_id], lazy="selectin")
    mae = relationship("Pet", foreign_keys=[mae_pet_id], lazy="selectin")

    def __repr__(self) -> str:
        return f"<Lineage id={self.id} pet_id={self.pet_id} registro='{self.registro}'>"
