from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class VeterinarioBase(BaseModel):
    """Atributos compartilhados do veterinário."""
    nome: str = Field(..., min_length=2, max_length=150, description="Nome completo do médico veterinário")
    crmv: str = Field(..., min_length=3, max_length=50, description="Número de registro no CRMV com UF (ex: CRMV-SP 12345)")
    especialidade: Optional[str] = Field(None, max_length=100, description="Especialidade clínica (ex: Clínica Geral, Cirurgia, Dermatologia)")
    telefone: Optional[str] = Field(None, max_length=30, description="Telefone de contato do profissional")
    email: Optional[str] = Field(None, max_length=255, description="E-mail profissional")
    ativo: bool = Field(True, description="Indica se o veterinário está ativo no corpo clínico")


class VeterinarioCreate(VeterinarioBase):
    """Schema para cadastro de novo veterinário."""
    pass


class VeterinarioUpdate(BaseModel):
    """Schema para atualização parcial de veterinário."""
    nome: Optional[str] = Field(None, min_length=2, max_length=150)
    crmv: Optional[str] = Field(None, min_length=3, max_length=50)
    especialidade: Optional[str] = Field(None, max_length=100)
    telefone: Optional[str] = Field(None, max_length=30)
    email: Optional[str] = Field(None, max_length=255)
    ativo: Optional[bool] = None


class VeterinarioResponse(VeterinarioBase):
    """Schema de resposta com dados do veterinário."""
    id: int
    clinic_id: int
    criado_em: datetime
    atualizado_em: datetime

    model_config = ConfigDict(from_attributes=True)
