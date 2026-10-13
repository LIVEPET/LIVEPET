import re
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
from app.schemas.user import validate_safe_image_url


class ClinicBase(BaseModel):
    """Atributos compartilhados da clínica veterinária."""
    nome: str = Field(..., min_length=2, max_length=150, description="Nome da clínica ou consultório veterinário")
    email: EmailStr = Field(..., description="E-mail de acesso e contato da clínica")
    crmv: Optional[str] = Field(None, max_length=50, description="Registro no CRMV do responsável técnico")
    cnpj: Optional[str] = Field(None, max_length=30, description="CNPJ da clínica (opcional)")
    telefone: Optional[str] = Field(None, max_length=30, description="Telefone principal de atendimento")
    whatsapp: Optional[str] = Field(None, max_length=30, description="Número de WhatsApp da clínica")
    endereco: Optional[str] = Field(None, max_length=255, description="Endereço físico completo")
    sobre: Optional[str] = Field(None, max_length=2000, description="Apresentação e história da clínica")
    foto_url: Optional[str] = Field(None, description="Logotipo ou foto da clínica")

    @field_validator("foto_url")
    def check_foto_url(cls, v: Optional[str]) -> Optional[str]:
        return validate_safe_image_url(v)


class ClinicCreate(ClinicBase):
    """Schema para cadastro de uma nova clínica."""
    senha: str = Field(..., min_length=6, max_length=100, description="Senha de acesso da clínica")

    @field_validator("senha")
    def validate_password_strength(cls, v: str) -> str:
        if not re.search(r"[A-Za-z]", v) or not re.search(r"\d", v):
            raise ValueError("A senha deve conter ao menos uma letra e um número para segurança.")
        return v


class ClinicLogin(BaseModel):
    """Schema para autenticação da clínica."""
    email: EmailStr = Field(..., description="E-mail cadastrado da clínica")
    senha: str = Field(..., min_length=1, max_length=100, description="Senha em texto puro")


class ClinicUpdate(BaseModel):
    """Schema para atualização do perfil da clínica."""
    nome: Optional[str] = Field(None, min_length=2, max_length=150)
    email: Optional[EmailStr] = None
    crmv: Optional[str] = Field(None, max_length=50)
    cnpj: Optional[str] = Field(None, max_length=30)
    telefone: Optional[str] = Field(None, max_length=30)
    whatsapp: Optional[str] = Field(None, max_length=30)
    endereco: Optional[str] = Field(None, max_length=255)
    sobre: Optional[str] = Field(None, max_length=2000)
    foto_url: Optional[str] = None
    senha: Optional[str] = Field(None, min_length=6, max_length=100)

    @field_validator("foto_url")
    def check_foto_url(cls, v: Optional[str]) -> Optional[str]:
        return validate_safe_image_url(v)

    @field_validator("senha")
    def validate_password_strength(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            if not re.search(r"[A-Za-z]", v) or not re.search(r"\d", v):
                raise ValueError("A senha deve conter ao menos uma letra e um número para segurança.")
        return v


class ClinicResponse(ClinicBase):
    """Schema de resposta com dados públicos/cadastrais da clínica."""
    id: int
    criado_em: datetime
    atualizado_em: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ClinicToken(BaseModel):
    """Schema de resposta do token de acesso da clínica."""
    access_token: str
    token_type: str = "bearer"
    clinica: ClinicResponse
