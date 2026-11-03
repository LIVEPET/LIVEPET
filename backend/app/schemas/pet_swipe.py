from datetime import datetime
from pydantic import BaseModel, Field


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