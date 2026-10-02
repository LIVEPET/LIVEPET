from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class MiniPet(BaseModel):
    id: int
    nome: str
    raca: Optional[str] = None
    foto_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class MiniUser(BaseModel):
    id: int
    nome: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class PetSummary(BaseModel):
    """Resumo de pet para busca de ascendência/linhagem por token público."""
    id: int
    nome: str
    especie: str
    raca: Optional[str] = None
    porte: Optional[str] = None
    sexo: Optional[str] = None
    foto_url: Optional[str] = None
    token_publico: str
    tutor_id: int
    tutor_nome: str
    tutor_canil: Optional[str] = None
    tutor_cidade: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class LineageRequestCreate(BaseModel):
    """Schema para criar uma solicitação de autorização de paternidade/maternidade."""
    filhote_pet_id: int = Field(..., description="ID do pet filhote que receberá o pedigree")
    ascendente_token: Optional[str] = Field(None, description="Token público do pet pai ou mãe")
    ascendente_pet_id: Optional[int] = Field(None, description="ID direto do pet pai ou mãe")
    tipo_vinculo: str = Field(..., pattern="^(pai|mae)$", description="'pai' ou 'mae'")
    mensagem: Optional[str] = Field(None, max_length=255, description="Mensagem opcional para o tutor do pet ascendente")


class LineageRequestResponse(BaseModel):
    """Schema de retorno de uma solicitação de linhagem."""
    id: int
    filhote_pet_id: int
    ascendente_pet_id: int
    tipo_vinculo: str
    solicitante_user_id: int
    solicitado_user_id: int
    status: str
    mensagem: Optional[str] = None
    criado_em: datetime
    respondido_em: Optional[datetime] = None

    # Informações enriquecidas (planas e aninhadas para compatibilidade total com o front-end)
    filhote_nome: Optional[str] = None
    filhote_foto_url: Optional[str] = None
    filhote_raca: Optional[str] = None
    ascendente_nome: Optional[str] = None
    ascendente_foto_url: Optional[str] = None
    ascendente_raca: Optional[str] = None
    solicitante_nome: Optional[str] = None
    solicitado_nome: Optional[str] = None

    filhote_pet: Optional[MiniPet] = None
    ascendente_pet: Optional[MiniPet] = None
    solicitante: Optional[MiniUser] = None
    solicitado: Optional[MiniUser] = None

    model_config = ConfigDict(from_attributes=True)
