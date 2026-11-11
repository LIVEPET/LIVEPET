from datetime import datetime
from pydantic import BaseModel, Field


class TestimonialCreate(BaseModel):
    """Dados enviados pelo tutor para criar um depoimento."""
    texto: str = Field(..., min_length=1, max_length=280, description="Texto do depoimento (até 280 caracteres)")


class TestimonialOut(BaseModel):
    """Depoimento público. Não expõe e-mail nem telefone do tutor."""
    id: int
    nome_tutor: str
    texto: str
    criado_em: datetime