from datetime import date
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class PetBase(BaseModel):
    """Atributos compartilhados do pet."""
    nome: str = Field(..., min_length=1, max_length=100, description="Nome do pet")
    especie: str = Field(..., min_length=1, max_length=50, description="Espécie do animal (ex: Cachorro, Gato)")
    raca: Optional[str] = Field(None, max_length=80, description="Raça do animal")
    porte: Optional[str] = Field(None, max_length=20, description="Porte do animal (Pequeno, Médio, Grande)")
    sexo: Optional[str] = Field(None, max_length=20, description="Sexo do animal (Macho, Fêmea)")
    data_nascimento: Optional[date] = Field(None, description="Data de nascimento do animal")
    cor: Optional[str] = Field(None, max_length=80, description="Cor da pelagem/penas")
    peso: Optional[float] = Field(None, ge=0, description="Peso em kg")
    foto_url: Optional[str] = Field(None, description="URL ou data-url da foto do animal")


class PetCreate(PetBase):
    """Schema para cadastro de um pet."""
    pass



class PetUpdate(BaseModel):
    """Schema para atualização parcial dos dados do pet."""
    nome: Optional[str] = Field(None, min_length=1, max_length=100)
    especie: Optional[str] = Field(None, min_length=1, max_length=50)
    raca: Optional[str] = Field(None, max_length=80)
    porte: Optional[str] = Field(None, max_length=20)
    sexo: Optional[str] = Field(None, max_length=20)
    data_nascimento: Optional[date] = None
    cor: Optional[str] = Field(None, max_length=80)
    peso: Optional[float] = Field(None, ge=0)
    foto_url: Optional[str] = Field(None, description="URL ou data-url da foto do animal")


from app.schemas.medical_record import MedicalRecordResponse
from app.schemas.vaccine import VaccineResponse
from app.schemas.care_contact import CareContactResponse
from app.schemas.lineage import LineageResponse


class PetResponse(PetBase):
    """Schema de resposta dos dados do pet para o tutor autenticado."""
    id: int
    user_id: int
    token_publico: str
    vaccines: list[VaccineResponse] = []
    medical_records: list[MedicalRecordResponse] = []
    care_contacts: list[CareContactResponse] = []
    lineage: Optional[LineageResponse] = None

    model_config = ConfigDict(from_attributes=True)


class PetExploreResponse(PetBase):
    """Schema de resposta para pets disponíveis na comunidade / MatchPet."""
    id: int
    user_id: int
    token_publico: str
    tutor_id: int
    tutor_nome: str
    tutor_cidade: Optional[str] = None
    tutor_telefone: Optional[str] = None
    vaccines: list[VaccineResponse] = []
    medical_records: list[MedicalRecordResponse] = []
    lineage: Optional[LineageResponse] = None

    model_config = ConfigDict(from_attributes=True)


class VaccinePublicSummary(BaseModel):
    """Resumo de vacinação para comprovação em resgate ou emergência."""
    nome: str
    data_aplicacao: Optional[date] = None
    proxima_dose: Optional[date] = None

    model_config = ConfigDict(from_attributes=True)


class PetPublicResponse(BaseModel):
    """Schema de resposta pública de emergência para leitura de QR Code."""
    nome: str
    especie: str
    raca: Optional[str] = None
    porte: Optional[str] = None
    sexo: Optional[str] = None
    cor: Optional[str] = None
    peso: Optional[float] = None
    foto_url: Optional[str] = None
    token_publico: str
    tutor_nome: str
    tutor_telefone: Optional[str] = None
    vacinas_principais: list[VaccinePublicSummary] = []
    avisos_medicos: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
