from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class MarketplaceListing(Base):
    """
    Modelo de Anúncio de Filhote / Ninhada do Marketplace LivePet.
    Persistido diretamente no banco de dados.
    Suporta ciclo de vida de 30 dias com confirmação via chat e expiração em 24h.
    """
    __tablename__ = "marketplace_listings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    pet_id = Column(
        Integer,
        ForeignKey("pets.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    titulo = Column(String(150), nullable=False)
    especie = Column(String(50), nullable=False, default="Cachorro")
    raca = Column(String(80), nullable=True)
    sexo = Column(String(20), nullable=True)  # "Macho", "Fêmea", "Misto"
    idade_meses = Column(Integer, nullable=True, default=2)
    quantidade = Column(Integer, nullable=False, default=1)
    cidade = Column(String(100), nullable=True)
    tipo = Column(String(20), nullable=False, default="venda")  # "venda" | "adocao"
    preco = Column(Float, nullable=False, default=0.0)
    pedigree = Column(Boolean, nullable=False, default=False)
    pedigree_registro = Column(String(100), nullable=True)
    descricao = Column(Text, nullable=True)
    foto_url = Column(Text, nullable=True)
    telefone_contato = Column(String(50), nullable=True)

    # Ciclo de vida: active, pending_confirmation, renewed, closed, expired
    status = Column(String(30), nullable=False, default="active", index=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    atualizado_em = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    confirmacao_enviada_em = Column(DateTime(timezone=True), nullable=True)

    # Relacionamentos
    tutor = relationship("User", back_populates="marketplace_listings")
    pet = relationship("Pet")

    def __repr__(self) -> str:
        return f"<MarketplaceListing id={self.id} titulo='{self.titulo}' status='{self.status}'>"
