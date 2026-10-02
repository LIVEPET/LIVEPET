from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserBase(BaseModel):
    """Atributos compartilhados do usuário."""
    nome: str = Field(..., min_length=2, max_length=150, description="Nome completo do tutor")
    email: EmailStr = Field(..., description="E-mail único do tutor")
    telefone: Optional[str] = Field(None, max_length=20, description="Telefone de contato")
    foto_url: Optional[str] = Field(None, description="Foto de perfil do tutor (URL ou data-url)")
    cidade: Optional[str] = Field(None, max_length=100, description="Cidade do tutor")
    estado: Optional[str] = Field(None, max_length=50, description="Estado do tutor")
    nome_canil: Optional[str] = Field(None, max_length=150, description="Nome do canil/gatil (opcional)")
    bio: Optional[str] = Field(None, max_length=500, description="Biografia ou apresentação do tutor")


class UserCreate(UserBase):
    """Schema para criação de um novo usuário/tutor."""
    senha: str = Field(..., min_length=6, max_length=100, description="Senha em texto puro para cadastro")


class UserUpdate(BaseModel):
    """Schema para atualização de dados do usuário."""
    nome: Optional[str] = Field(None, min_length=2, max_length=150)
    email: Optional[EmailStr] = None
    telefone: Optional[str] = Field(None, max_length=20)
    senha: Optional[str] = Field(None, min_length=6, max_length=100)
    foto_url: Optional[str] = None
    cidade: Optional[str] = Field(None, max_length=100)
    estado: Optional[str] = Field(None, max_length=50)
    nome_canil: Optional[str] = Field(None, max_length=150)
    bio: Optional[str] = Field(None, max_length=500)


class UserResponse(UserBase):
    """Schema de resposta do usuário (sem expor senha_hash)."""
    id: int
    criado_em: datetime

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    """Schema do token JWT de autenticação."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class LoginRequest(BaseModel):
    """Schema para login via JSON."""
    email: EmailStr
    senha: str = Field(..., min_length=1)
