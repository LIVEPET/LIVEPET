from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class LineageRequest(Base):
    """
    Solicitação de autorização de paternidade ou maternidade entre tutores no LivePet.
    """
    __tablename__ = "lineage_requests"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    filhote_pet_id = Column(
        Integer,
        ForeignKey("pets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    ascendente_pet_id = Column(
        Integer,
        ForeignKey("pets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    tipo_vinculo = Column(String(20), nullable=False)  # 'pai' ou 'mae'
    solicitante_user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    solicitado_user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status = Column(String(30), default="pendente", nullable=False)  # 'pendente', 'aprovado', 'recusado'
    mensagem = Column(String(255), nullable=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    respondido_em = Column(DateTime(timezone=True), nullable=True)

    # Relacionamentos
    filhote = relationship("Pet", foreign_keys=[filhote_pet_id], lazy="selectin")
    ascendente = relationship("Pet", foreign_keys=[ascendente_pet_id], lazy="selectin")
    solicitante = relationship("User", foreign_keys=[solicitante_user_id], lazy="selectin")
    solicitado = relationship("User", foreign_keys=[solicitado_user_id], lazy="selectin")

    def __repr__(self) -> str:
        return (
            f"<LineageRequest id={self.id} filhote={self.filhote_pet_id} "
            f"ascendente={self.ascendente_pet_id} tipo='{self.tipo_vinculo}' status='{self.status}'>"
        )
