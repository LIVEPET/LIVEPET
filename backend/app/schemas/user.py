import re
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


def validate_safe_image_url(v: Optional[str]) -> Optional[str]:
    """Valida protocolos e limites seguros para foto_url evitando XSS e payloads abusivos."""
    if not v:
        return None
    if len(v) > 3_000_000:
        raise ValueError("A foto excede o limite máximo permitido de 3MB.")
    v_clean = v.strip().lower()
    if v_clean.startswith("javascript:") or v_clean.startswith("vbscript:"):
        raise ValueError("Protocolo de URL inseguro.")
    allowed_prefixes = (
        "http://",
        "https://",
        "data:image/jpeg",
        "data:image/jpg",
        "data:image/png",
        "data:image/webp",
        "data:image/gif",
    )
    if not any(v_clean.startswith(p) for p in allowed_prefixes):
        raise ValueError(
            "URL de foto inválida. Utilize HTTP/HTTPS ou imagens nos formatos PNG, JPEG ou WEBP."
        )
    return v


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

    @field_validator("foto_url")
    def check_foto_url(cls, v: Optional[str]) -> Optional[str]:
        return validate_safe_image_url(v)


class UserCreate(UserBase):
    """Schema para criação de um novo usuário/tutor com senha forte."""
    senha: str = Field(..., min_length=6, max_length=100, description="Senha em texto puro para cadastro")

    @field_validator("senha")
    def validate_password_strength(cls, v: str) -> str:
        if not re.search(r"[A-Za-z]", v) or not re.search(r"\d", v):
            raise ValueError("A senha deve conter ao menos uma letra e um número para segurança.")
        return v


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

    @field_validator("foto_url")
    def check_foto_url(cls, v: Optional[str]) -> Optional[str]:
        return validate_safe_image_url(v)

    @field_validator("senha")
    def validate_update_password_strength(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            if not re.search(r"[A-Za-z]", v) or not re.search(r"\d", v):
                raise ValueError("A senha deve conter ao menos uma letra e um número para segurança.")
        return v


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
