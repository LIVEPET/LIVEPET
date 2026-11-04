from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class SwipeCreate(BaseModel):
    """Ação de um pet sobre outro no MatchPet."""
    pet_destino_id: int = Field(..., description="ID do pet que recebe a ação")
    acao: str = Field(
        ...,
        pattern="^(like|super_like|pass)$",
        description="'like', 'super_like' ou 'pass'",
    )


class SwipeResponse(BaseModel):
    """Resposta ao registrar uma ação, informando se houve match mútuo."""
    pet_origem_id: int = Field(..., description="ID do pet que realiza a ação")
    pet_destino_id: int
    acao: str
    match: bool
    criado_em: datetime


class SwipeItem(BaseModel):
    """Item da lista de pets já vistos por um pet."""
    pet_destino_id: int
    acao: str
    criado_em: datetime

    model_config = ConfigDict(from_attributes=True)


class MatchResponse(BaseModel):
    """Pet com match mútuo, com os dados de contato do tutor."""
    pet_id: int
    nome: str
    especie: str
    raca: Optional[str] = None
    foto_url: Optional[str] = None
    tutor_id: int
    tutor_nome: str
    tutor_cidade: Optional[str] = None
    tutor_telefone: Optional[str] = None