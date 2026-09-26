from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class PetBase(BaseModel):
    """Atributos compartilhados do pet."""
    nome: str = Field(..., min_length=1, max_length=100, description="Nome do pet")
    especie: str = Field(..., min_length=1, max_length=50, description="Espécie do animal (ex: cão, gato)")
    raca: Optional[str] = Field(None, max_length=50, description="Raça do animal")
    porte: Optional[str] = Field(None, max_length=20, description="Porte do animal (pequeno, médio, grande)")
    peso: Optional[float] = Field(None, ge=0, description="Peso em kg")
    foto_url: Optional[str] = Field(None, max_length=500, description="URL da foto do animal")


class PetCreate(PetBase):
    """Schema para cadastro de um pet."""
    user_id: Optional[int] = Field(None, description="ID do tutor (se não inferido via autenticação)")
    token_publico: Optional[str] = Field(None, max_length=64, description="Token público customizado para QR Code")


class PetUpdate(BaseModel):
    """Schema para atualização parcial dos dados do pet."""
    nome: Optional[str] = Field(None, min_length=1, max_length=100)
    especie: Optional[str] = Field(None, min_length=1, max_length=50)
    raca: Optional[str] = Field(None, max_length=50)
    porte: Optional[str] = Field(None, max_length=20)
    peso: Optional[float] = Field(None, ge=0)
    foto_url: Optional[str] = Field(None, max_length=500)


class PetResponse(PetBase):
    """Schema de resposta dos dados do pet."""
    id: int
    user_id: int
    token_publico: str

    model_config = ConfigDict(from_attributes=True)
