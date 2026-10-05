from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, ConfigDict, Field


class MarketplaceListingBase(BaseModel):
    titulo: str = Field(..., min_length=3, max_length=150, description="Título do anúncio")
    especie: str = Field(..., min_length=2, max_length=50, description="Espécie (Cachorro, Gato, Ave, Outro)")
    raca: Optional[str] = Field(None, max_length=80, description="Raça do filhote")
    sexo: Optional[str] = Field("Macho", max_length=20, description="Sexo (Macho, Fêmea, Misto)")
    idade_meses: Optional[int] = Field(2, ge=0, description="Idade estimada em meses")
    quantidade: Optional[int] = Field(1, ge=1, description="Quantidade disponível de filhotes")
    cidade: Optional[str] = Field(None, max_length=100, description="Cidade e UF")
    tipo: Optional[str] = Field("venda", description="Tipo de anúncio: 'venda' ou 'adocao'")
    preco: Optional[float] = Field(0.0, ge=0, description="Preço em R$ (0 para adoção)")
    pedigree: Optional[bool] = Field(False, description="Possui registro de pedigree")
    pedigree_registro: Optional[str] = Field(None, max_length=100, description="Número do pedigree/registro")
    descricao: Optional[str] = Field(None, description="Descrição detalhada do anúncio")
    foto_url: Optional[str] = Field(None, description="Foto do animal (URL ou base64 data-url)")
    telefone_contato: Optional[str] = Field(None, max_length=50, description="Telefone / WhatsApp de contato")
    pet_id: Optional[int] = Field(None, description="ID do pet já cadastrado (opcional)")


class MarketplaceListingCreate(MarketplaceListingBase):
    pass


class MarketplaceListingUpdate(BaseModel):
    titulo: Optional[str] = Field(None, min_length=3, max_length=150)
    especie: Optional[str] = Field(None, min_length=2, max_length=50)
    raca: Optional[str] = Field(None, max_length=80)
    sexo: Optional[str] = Field(None, max_length=20)
    idade_meses: Optional[int] = Field(None, ge=0)
    quantidade: Optional[int] = Field(None, ge=1)
    cidade: Optional[str] = Field(None, max_length=100)
    tipo: Optional[str] = None
    preco: Optional[float] = Field(None, ge=0)
    pedigree: Optional[bool] = None
    pedigree_registro: Optional[str] = Field(None, max_length=100)
    descricao: Optional[str] = None
    foto_url: Optional[str] = None
    telefone_contato: Optional[str] = Field(None, max_length=50)
    status: Optional[str] = None


class MarketplaceListingResponse(MarketplaceListingBase):
    id: int
    user_id: int
    tutor_nome: str
    tutor_telefone: Optional[str] = None
    status: str
    criado_em: datetime
    atualizado_em: datetime
    confirmacao_enviada_em: Optional[datetime] = None
    is_owner: bool = False
    needs_confirmation: bool = False
    expired_deadline: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class MarketplaceConfirmAction(BaseModel):
    acao: Literal["renovar", "encerrar"] = Field(
        ...,
        description="'renovar' continua o anúncio por mais 30 dias; 'encerrar' exclui o anúncio do banco."
    )
