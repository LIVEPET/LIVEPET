from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class MedicalRecordBase(BaseModel):
    """Atributos compartilhados do prontuário / histórico médico."""
    tipo: str = Field(..., min_length=1, max_length=50, description="Tipo do registro (ex: Consulta, Cirurgia, Exame, Retorno)")
    descricao: Optional[str] = Field(None, description="Descrição detalhada do atendimento ou observações clínicas")
    peso_registrado: Optional[float] = Field(None, ge=0, description="Peso aferido durante a consulta (kg)")


class MedicalRecordCreate(MedicalRecordBase):
    """Schema para cadastro de histórico médico."""
    pet_id: Optional[int] = Field(None, description="ID do pet (se não fornecido no path do endpoint)")
    data_registro: Optional[datetime] = Field(None, description="Data e hora do registro (default é o momento atual)")


class MedicalRecordUpdate(BaseModel):
    """Schema para atualização de dados do prontuário médico."""
    tipo: Optional[str] = Field(None, min_length=1, max_length=50)
    descricao: Optional[str] = None
    peso_registrado: Optional[float] = Field(None, ge=0)
    data_registro: Optional[datetime] = None


class MedicalRecordResponse(MedicalRecordBase):
    """Schema de resposta do histórico médico."""
    id: int
    pet_id: int
    data_registro: datetime

    model_config = ConfigDict(from_attributes=True)
