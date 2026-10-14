from datetime import datetime, date as date_type
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class ClinicAppointmentBase(BaseModel):
    pet_name: str = Field(..., min_length=1, max_length=100, description="Nome do pet")
    species: str = Field(..., min_length=1, max_length=50, description="Espécie do pet")
    breed: Optional[str] = Field("—", max_length=80, description="Raça do pet")
    tutor: str = Field(..., min_length=1, max_length=100, description="Nome do tutor")
    phone: str = Field(..., min_length=8, max_length=30, description="Telefone de contato do tutor")
    service: str = Field(..., min_length=1, max_length=100, description="Serviço veterinário agendado")
    vet: Optional[str] = Field("Equipe da clínica", max_length=100, description="Veterinário responsável")
    date: Optional[str] = Field(None, max_length=10, description="Data do atendimento (AAAA-MM-DD)")
    time: str = Field(..., min_length=1, max_length=10, description="Horário do atendimento (HH:MM)")
    status: Optional[str] = Field("Confirmado", max_length=30, description="Status do atendimento")
    notes: Optional[str] = Field(None, description="Observações ou queixa principal")


class ClinicAppointmentCreate(ClinicAppointmentBase):
    pass


class ClinicAppointmentUpdate(BaseModel):
    pet_name: Optional[str] = Field(None, min_length=1, max_length=100)
    species: Optional[str] = Field(None, min_length=1, max_length=50)
    breed: Optional[str] = Field(None, max_length=80)
    tutor: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, min_length=8, max_length=30)
    service: Optional[str] = Field(None, min_length=1, max_length=100)
    vet: Optional[str] = Field(None, max_length=100)
    date: Optional[str] = Field(None, max_length=10)
    time: Optional[str] = Field(None, min_length=1, max_length=10)
    status: Optional[str] = Field(None, max_length=30)
    notes: Optional[str] = None


class ClinicAppointmentStatusUpdate(BaseModel):
    status: str = Field(..., min_length=2, max_length=30, description="Novo status do atendimento")


class ClinicAppointmentResponse(ClinicAppointmentBase):
    id: int
    clinic_id: int
    criado_em: datetime
    atualizado_em: datetime

    model_config = ConfigDict(from_attributes=True)
