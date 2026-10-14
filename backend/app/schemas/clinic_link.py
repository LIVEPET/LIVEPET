from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class ClinicPetLinkCreate(BaseModel):
    pet_identifier: str = Field(..., min_length=1, max_length=100, description="ID numérico ou Token Público do Pet na LivePet")
    local_patient_id: Optional[str] = Field(None, max_length=100, description="ID do paciente local da clínica")
    mensagem: Optional[str] = Field(None, max_length=500, description="Mensagem opcional de solicitação ao tutor")


class ClinicPetLinkAction(BaseModel):
    acao: str = Field(..., pattern="^(aprovar|recusar)$", description="Ação do tutor: 'aprovar' ou 'recusar'")


class ClinicPetLinkResponse(BaseModel):
    id: int
    clinic_id: int
    clinic_name: str
    pet_id: int
    pet_name: str
    pet_species: Optional[str] = None
    pet_breed: Optional[str] = None
    pet_photo: Optional[str] = None
    tutor_name: str
    local_patient_id: Optional[str] = None
    status: str
    mensagem: Optional[str] = None
    criado_em: datetime
    atualizado_em: datetime

    model_config = ConfigDict(from_attributes=True)
