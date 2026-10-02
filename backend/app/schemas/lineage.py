from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class LineageBase(BaseModel):
    """Atributos de linhagem e pedigree."""
    registro: Optional[str] = Field(None, max_length=100, description="Registro oficial (ex: CBKC nº 4521987)")
    generacoes: int = Field(3, ge=1, le=10)
    pai_pet_id: Optional[int] = Field(None, description="ID do pet pai no LivePet")
    mae_pet_id: Optional[int] = Field(None, description="ID do pet mãe no LivePet")
    status_verificacao: str = Field("declaratorio", description="Status de verificação (declaratorio, pendente, aprovado)")
    pai_nome: Optional[str] = Field(None, max_length=150)
    pai_registro: Optional[str] = Field(None, max_length=100)
    pai_titulos: Optional[str] = Field(None, max_length=200)
    mae_nome: Optional[str] = Field(None, max_length=150)
    mae_registro: Optional[str] = Field(None, max_length=100)
    mae_titulos: Optional[str] = Field(None, max_length=200)
    avo_pat_m_nome: Optional[str] = Field(None, max_length=150)
    avo_pat_m_registro: Optional[str] = Field(None, max_length=100)
    avo_pat_f_nome: Optional[str] = Field(None, max_length=150)
    avo_pat_f_registro: Optional[str] = Field(None, max_length=100)
    avo_mat_m_nome: Optional[str] = Field(None, max_length=150)
    avo_mat_m_registro: Optional[str] = Field(None, max_length=100)
    avo_mat_f_nome: Optional[str] = Field(None, max_length=150)
    avo_mat_f_registro: Optional[str] = Field(None, max_length=100)


class LineageCreate(LineageBase):
    pet_id: Optional[int] = None


class LineageResponse(LineageBase):
    id: int
    pet_id: int
    criado_em: datetime

    model_config = ConfigDict(from_attributes=True)
