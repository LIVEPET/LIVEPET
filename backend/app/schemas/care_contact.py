from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class CareContactBase(BaseModel):
    """Atributos compartilhados do contato da rede de cuidados."""
    nome: str = Field(..., min_length=1, max_length=150, description="Nome do contato")
    funcao: str = Field(..., min_length=1, max_length=100, description="Função (ex: Tutora, Veterinária, Pet Sitter)")
    categoria: str = Field("emergency", description="Categoria: emergency ou care")
    telefone: str = Field(..., min_length=8, max_length=50, description="Telefone de contato")
    email: Optional[str] = Field(None, max_length=255, description="E-mail de contato")
    foto_url: Optional[str] = Field(None, max_length=500, description="URL da foto")
    relacao_tutor: Optional[str] = Field(None, max_length=100)
    relacao_pet: Optional[str] = Field(None, max_length=100)
    nivel_vinculo: Optional[str] = Field("Alto", max_length=50)
    observacoes: Optional[str] = None


class CareContactCreate(CareContactBase):
    pet_id: Optional[int] = None


class CareContactResponse(CareContactBase):
    id: int
    pet_id: int
    criado_em: datetime

    model_config = ConfigDict(from_attributes=True)
