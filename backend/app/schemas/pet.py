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
    foto_url: Optional[str] = Field(None, max_length=500, description="URL da foto do animal")


class PetCreate(PetBase):
    """Schema para cadastro de um pet."""
    user_id: Optional[int] = Field(None, description="ID do tutor (se não inferido via autenticação)")
    token_publico: Optional[str] = Field(None, max_length=64, description="Token público customizado para QR Code")


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
    foto_url: Optional[str] = Field(None, max_length=500)


class PetResponse(PetBase):
    """Schema de resposta dos dados do pet para o tutor autenticado."""
    id: int
    user_id: int
    token_publico: str

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
    avisos_medicos: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
