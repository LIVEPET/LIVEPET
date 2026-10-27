from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.sql import func
from app.core.database import Base


class PetSwipe(Base):
    """Ação de um pet sobre outro no MatchPet: curtir, super curtir ou passar."""
    
    __tablename__ = "pet_swipes"
    __table_args__ = (
        UniqueConstraint("pet_origem_id", "pet_destino_id", name="uq_pet_swipes_par"),
        CheckConstraint("pet_origem_id <> pet_destino_id", name="ck_pet_swipes_pets_diferentes"),
        CheckConstraint("acao IN ('like', 'super_like', 'pass')", name="ck_pet_swipes_acao"),
    )

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    pet_origem_id = Column(
        Integer,
        ForeignKey("pets.id", ondelete="CASCADE"),
        nullable=False,
    )
    pet_destino_id = Column(
        Integer,
        ForeignKey("pets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    acao = Column(String(20), nullable=False)  # 'like', 'super_like' ou 'pass'
    criado_em = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)