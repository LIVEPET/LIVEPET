from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class ClinicPetLinkRequest(Base):
    """
    Modelo de Solicitação de Vínculo de Pet entre Clínica e Tutor (Issue #59).
    Permite que a clínica solicite vincular um paciente local a um Pet oficial cadastrado por um Tutor na LivePet.
    O tutor deve aprovar a solicitação para que ocorra o compartilhamento do prontuário e dados cadastrais.
    """
    __tablename__ = "clinic_pet_link_requests"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    clinic_id = Column(
        Integer,
        ForeignKey("clinics.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    pet_id = Column(
        Integer,
        ForeignKey("pets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    local_patient_id = Column(String(100), nullable=True)
    status = Column(String(20), nullable=False, default="pendente")  # pendente, aprovado, recusado
    mensagem = Column(Text, nullable=True)

    criado_em = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    atualizado_em = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    clinic = relationship("Clinic", backref="link_requests")
    pet = relationship("Pet", backref="clinic_link_requests")

    def __repr__(self) -> str:
        return f"<ClinicPetLinkRequest id={self.id} clinic_id={self.clinic_id} pet_id={self.pet_id} status='{self.status}'>"
