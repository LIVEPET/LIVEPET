from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserBase(BaseModel):
    """Atributos compartilhados do usuário."""
    nome: str = Field(..., min_length=2, max_length=150, description="Nome completo do tutor")
    email: EmailStr = Field(..., description="E-mail único do tutor")
    telefone: Optional[str] = Field(None, max_length=20, description="Telefone de contato")


class UserCreate(UserBase):
    """Schema para criação de um novo usuário/tutor."""
    senha: str = Field(..., min_length=6, max_length=100, description="Senha em texto puro para cadastro")


class UserUpdate(BaseModel):
    """Schema para atualização de dados do usuário."""
    nome: Optional[str] = Field(None, min_length=2, max_length=150)
    email: Optional[EmailStr] = None
    telefone: Optional[str] = Field(None, max_length=20)
    senha: Optional[str] = Field(None, min_length=6, max_length=100)


class UserResponse(UserBase):
    """Schema de resposta pública do usuário (sem expor senha_hash)."""
    id: int
    criado_em: datetime

    model_config = ConfigDict(from_attributes=True)
