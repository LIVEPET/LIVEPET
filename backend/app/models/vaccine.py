from sqlalchemy import Column, Integer, String, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Vaccine(Base):
    """
    Modelo de Vacina vinculada a um Pet.
    """
    __tablename__ = "vaccines"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    pet_id = Column(
        Integer,
        ForeignKey("pets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    nome = Column(String(100), nullable=False)
    data_aplicacao = Column(Date, nullable=False)
    proxima_dose = Column(Date, nullable=True)
    lote = Column(String(50), nullable=True)
    veterinario = Column(String(100), nullable=True)

    # Relacionamento N:1 com Pet
    pet = relationship("Pet", back_populates="vaccines")

    def __repr__(self) -> str:
        return f"<Vaccine id={self.id} nome='{self.nome}' pet_id={self.pet_id}>"
