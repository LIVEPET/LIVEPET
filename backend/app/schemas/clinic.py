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
    servicos: Optional[str] = Field(None, description="Lista codificada de serviços/produtos e preços")
    horarios: Optional[str] = Field(None, description="Lista codificada de horários de funcionamento")
    equipe: Optional[str] = Field(None, description="Lista codificada de membros da equipe e CRMVs")

    @field_validator("foto_url")
    def check_foto_url(cls, v: Optional[str]) -> Optional[str]:
        return validate_safe_image_url(v)


class ClinicCreate(ClinicBase):
    """Schema para cadastro de uma nova clínica veterinária parceira."""
    senha: str = Field(..., min_length=6, max_length=100, description="Senha de acesso da clínica (mínimo 6 caracteres, letras e números)")

    @field_validator("senha")
    def validate_password_strength(cls, v: str) -> str:
        if not re.search(r"[A-Za-z]", v) or not re.search(r"\d", v):
            raise ValueError("A senha deve conter ao menos uma letra e um número para segurança.")
        return v

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "nome": "Clínica Veterinária Vida Animal",
                "email": "contato@vidanimal.com.br",
                "senha": "senhaClinica123",
                "crmv": "CRMV-GO 12345",
                "cnpj": "12.345.678/0001-90",
                "telefone": "(62) 3200-1122",
                "whatsapp": "(62) 98888-2233",
                "endereco": "Av. T-63, 1200 - St. Nova Suíça, Goiânia - GO",
                "sobre": "Clínica veterinária 24 horas especializada em cuidados preventivos, cirurgias e emergências.",
                "foto_url": "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=400",
            }
        }
    )


class ClinicLogin(BaseModel):
    """Schema para autenticação da clínica veterinária."""
    email: EmailStr = Field(..., description="E-mail cadastrado da clínica")
    senha: str = Field(..., min_length=1, max_length=100, description="Senha de acesso da clínica")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "contato@vidanimal.com.br",
                "senha": "senhaClinica123",
            }
        }
    )


class ClinicUpdate(BaseModel):
    """Schema para atualização do perfil da clínica veterinária."""
    nome: Optional[str] = Field(None, min_length=2, max_length=150, description="Nome atualizado da clínica")
    email: Optional[EmailStr] = Field(None, description="Novo e-mail de acesso da clínica")
    crmv: Optional[str] = Field(None, max_length=50, description="Registro atualizado no CRMV")
    cnpj: Optional[str] = Field(None, max_length=30, description="CNPJ atualizado")
    telefone: Optional[str] = Field(None, max_length=30, description="Telefone de atendimento")
    whatsapp: Optional[str] = Field(None, max_length=30, description="WhatsApp da clínica")
    endereco: Optional[str] = Field(None, max_length=255, description="Endereço físico completo")
    sobre: Optional[str] = Field(None, max_length=2000, description="Texto de apresentação e especialidades")
    foto_url: Optional[str] = Field(None, description="URL do logotipo ou foto da clínica")
    servicos: Optional[str] = Field(None, description="Lista codificada de serviços/produtos e preços")
    horarios: Optional[str] = Field(None, description="Lista codificada de horários de funcionamento")
    equipe: Optional[str] = Field(None, description="Lista codificada de membros da equipe e CRMVs")
    senha: Optional[str] = Field(None, min_length=6, max_length=100, description="Nova senha (se desejar alterar)")

    @field_validator("foto_url")
    def check_foto_url(cls, v: Optional[str]) -> Optional[str]:
        return validate_safe_image_url(v)

    @field_validator("senha")
    def validate_password_strength(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            if not re.search(r"[A-Za-z]", v) or not re.search(r"\d", v):
                raise ValueError("A senha deve conter ao menos uma letra e um número para segurança.")
        return v

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "nome": "Clínica Veterinária Vida Animal 24h",
                "telefone": "(62) 3200-9988",
                "whatsapp": "(62) 99999-5544",
                "endereco": "Av. T-63, 1250 - St. Nova Suíça, Goiânia - GO",
                "sobre": "Atendimento 24h, internação com monitoramento contínuo e exames laboratoriais.",
            }
        }
    )


class ClinicResponse(ClinicBase):
    """Schema de resposta com dados públicos e cadastrais da clínica veterinária."""
    id: int = Field(..., description="Identificador único da clínica")
    criado_em: datetime = Field(..., description="Data e hora de criação do cadastro")
    atualizado_em: Optional[datetime] = Field(None, description="Data e hora da última atualização cadastral")

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": 1,
                "nome": "Clínica Veterinária Vida Animal",
                "email": "contato@vidanimal.com.br",
                "crmv": "CRMV-GO 12345",
                "cnpj": "12.345.678/0001-90",
                "telefone": "(62) 3200-1122",
                "whatsapp": "(62) 98888-2233",
                "endereco": "Av. T-63, 1200 - St. Nova Suíça, Goiânia - GO",
                "sobre": "Clínica veterinária 24 horas especializada em cuidados preventivos.",
                "foto_url": "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=400",
                "criado_em": "2026-10-14T00:00:00Z",
                "atualizado_em": None,
            }
        }
    )


class ClinicToken(BaseModel):
    """Schema de resposta com o Bearer token JWT e dados da clínica autenticada."""
    access_token: str = Field(..., description="Token JWT de acesso (Bearer)")
    token_type: str = Field("bearer", description="Tipo de autenticação (Bearer)")
    clinica: ClinicResponse = Field(..., description="Dados cadastrais da clínica autenticada")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "clinica": {
                    "id": 1,
                    "nome": "Clínica Veterinária Vida Animal",
                    "email": "contato@vidanimal.com.br",
                    "crmv": "CRMV-GO 12345",
                    "cnpj": "12.345.678/0001-90",
                    "telefone": "(62) 3200-1122",
                    "whatsapp": "(62) 98888-2233",
                    "endereco": "Av. T-63, 1200 - St. Nova Suíça, Goiânia - GO",
                    "sobre": "Clínica veterinária 24 horas especializada em cuidados preventivos.",
                    "foto_url": "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=400",
                    "criado_em": "2026-10-14T00:00:00Z",
                    "atualizado_em": None,
                },
            }
        }
    )
