from datetime import date, datetime, time
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator
from app.schemas.pet import PetBase
from app.schemas.medical_record import MedicalRecordResponse


APPOINTMENT_STATUSES = {"Confirmado", "Aguardando", "Em atendimento", "Concluído", "Cancelado"}


class AppointmentInput(BaseModel):
    @model_validator(mode="before")
    @classmethod
    def validate_schedule(cls, values):
        if not isinstance(values, dict):
            raise ValueError("O corpo deve ser um objeto JSON.")
        values = dict(values)
        required = {"pet_name", "species", "tutor", "phone", "service", "time", "status"}
        for key in required & values.keys():
            if not isinstance(values[key], str) or not values[key].strip():
                raise ValueError(f"{key} não pode ser vazio.")
            values[key] = values[key].strip()
        try:
            if "date" in values and values["date"] is not None:
                values["date"] = date.fromisoformat(values["date"]).isoformat()
            if "time" in values:
                parsed = time.fromisoformat(values["time"])
                if len(values["time"]) != 5 or parsed.tzinfo is not None:
                    raise ValueError("Horário deve usar HH:MM.")
        except TypeError as exc:
            raise ValueError("Data e horário devem ser strings ISO.") from exc
        if "status" in values and values["status"] not in APPOINTMENT_STATUSES:
            raise ValueError("Status de atendimento inválido.")
        return values


class RegisteredPatientResponse(PetBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class PatientDetailsResponse(RegisteredPatientResponse):
    medical_records: List[MedicalRecordResponse] = Field(default_factory=list)


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
    pet_id: Optional[int] = Field(None, description="ID do pet oficial no LivePet caso vinculado")
    queixa_principal: Optional[str] = Field(None, description="Anamnese")
    temperatura: Optional[float] = Field(None, description="Temperatura em °C")
    peso: Optional[float] = Field(None, description="Peso em kg")
    frequencia_cardiaca: Optional[int] = Field(None, description="FC em bpm")
    frequencia_respiratoria: Optional[int] = Field(None, description="FR em mpm")
    mucosas: Optional[str] = Field(None, description="Mucosas")
    diagnostico: Optional[str] = Field(None, description="Diagnóstico")
    prescricao: Optional[str] = Field(None, description="Prescrição")
    vacina_aplicada: Optional[str] = Field(None, description="Vacina aplicada")
    vacina_lote: Optional[str] = Field(None, description="Lote da vacina")
    vacina_proxima_dose: Optional[str] = Field(None, description="Próxima dose da vacina")


class ClinicAppointmentCreate(ClinicAppointmentBase, AppointmentInput):
    pass


class ClinicAppointmentUpdate(AppointmentInput):
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
    pet_id: Optional[int] = None
    queixa_principal: Optional[str] = None
    temperatura: Optional[float] = None
    peso: Optional[float] = None
    frequencia_cardiaca: Optional[int] = None
    frequencia_respiratoria: Optional[int] = None
    mucosas: Optional[str] = None
    diagnostico: Optional[str] = None
    prescricao: Optional[str] = None
    vacina_aplicada: Optional[str] = None
    vacina_lote: Optional[str] = None
    vacina_proxima_dose: Optional[str] = None


class ClinicAppointmentStatusUpdate(AppointmentInput):
    status: str = Field(..., min_length=2, max_length=30, description="Novo status do atendimento")


class ClinicAppointmentConclusion(BaseModel):
    queixa_principal: Optional[str] = Field(None, description="Anamnese e queixa principal")
    temperatura: Optional[float] = Field(None, description="Temperatura retal em °C (ex: 38.5)")
    peso: Optional[float] = Field(None, description="Peso atual em kg (ex: 12.4)")
    frequencia_cardiaca: Optional[int] = Field(None, description="Frequência cardíaca em bpm (ex: 110)")
    frequencia_respiratoria: Optional[int] = Field(None, description="Frequência respiratória em mpm (ex: 24)")
    mucosas: Optional[str] = Field(None, description="Coloração das mucosas (ex: normocoradas)")
    diagnostico: Optional[str] = Field(None, description="Diagnóstico clínico e avaliação")
    prescricao: Optional[str] = Field(None, description="Prescrição, receita e orientações")
    vacina_aplicada: Optional[str] = Field(None, description="Nome da vacina aplicada no ato")
    vacina_lote: Optional[str] = Field(None, description="Lote da vacina")
    vacina_proxima_dose: Optional[str] = Field(None, description="Data prevista para o reforço")


class ClinicPatientUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    species: Optional[str] = Field(None, min_length=1, max_length=50)
    breed: Optional[str] = Field(None, max_length=80)
    age: Optional[str] = Field(None, max_length=50)
    weight: Optional[str] = Field(None, max_length=50)
    tutor: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, min_length=8, max_length=30)
    alerts: Optional[List[str]] = None


class ClinicAppointmentResponse(ClinicAppointmentBase):
    id: int
    clinic_id: int
    criado_em: datetime
    atualizado_em: datetime

    model_config = ConfigDict(from_attributes=True)

