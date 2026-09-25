from datetime import date
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class VaccineBase(BaseModel):
    """Atributos compartilhados da vacina."""
    nome: str = Field(..., min_length=1, max_length=100, description="Nome da vacina aplicada")
    data_aplicacao: date = Field(..., description="Data em que a dose foi administrada")
    proxima_dose: Optional[date] = Field(None, description="Data prevista para a próxima dose / reforço")
    lote: Optional[str] = Field(None, max_length=50, description="Número do lote da vacina")
    veterinario: Optional[str] = Field(None, max_length=100, description="Nome do médico veterinário responsável")


class VaccineCreate(VaccineBase):
    """Schema para registro de vacina."""
    pet_id: Optional[int] = Field(None, description="ID do pet vacinado (se não fornecido no path do endpoint)")


class VaccineUpdate(BaseModel):
    """Schema para atualização de dados da vacina."""
    nome: Optional[str] = Field(None, min_length=1, max_length=100)
    data_aplicacao: Optional[date] = None
    proxima_dose: Optional[date] = None
    lote: Optional[str] = Field(None, max_length=50)
    veterinario: Optional[str] = Field(None, max_length=100)


class VaccineResponse(VaccineBase):
    """Schema de resposta dos dados da vacina."""
    id: int
    pet_id: int

    model_config = ConfigDict(from_attributes=True)
