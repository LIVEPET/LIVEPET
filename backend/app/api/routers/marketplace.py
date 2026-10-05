from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from app.api.deps import get_current_user, oauth2_scheme
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.marketplace_listing import MarketplaceListing
from app.models.user import User
from app.schemas.marketplace_listing import (
    MarketplaceListingCreate,
    MarketplaceListingUpdate,
    MarketplaceListingResponse,
    MarketplaceConfirmAction,
)

router = APIRouter(prefix="/marketplace", tags=["Marketplace Filhotes"])


def get_optional_current_user(
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme),
) -> Optional[User]:
    """Obtém o usuário atual se logado, ou None para visitantes públicos."""
    if not token:
        return None
    payload = decode_access_token(token)
    if not payload:
        return None
    user_id_str = payload.get("sub")
    if not user_id_str:
        return None
    try:
        user_id = int(user_id_str)
        return db.query(User).filter(User.id == user_id).first()
    except Exception:
        return None


def process_listing_lifecycle(db: Session):
    """
    Executa verificação das regras de ciclo de vida do marketplace:
    1. Anúncios ativos com >= 30 dias mudam para 'pending_confirmation' e marcam confirmacao_enviada_em.
    2. Anúncios em 'pending_confirmation' que não foram respondidos em 24h são deletados do banco.
    """
    now = datetime.now(timezone.utc)
    modified = False

    # 1. Verifica anúncios ativos com mais de 30 dias
    active_listings = db.query(MarketplaceListing).filter(
        MarketplaceListing.status == "active"
    ).all()

    for listing in active_listings:
        created = listing.criado_em
        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        if (now - created) >= timedelta(days=30):
            listing.status = "pending_confirmation"
            listing.confirmacao_enviada_em = now
            modified = True

    # 2. Verifica pendentes de confirmação que passaram 24h sem resposta -> deleta do banco
    pending_listings = db.query(MarketplaceListing).filter(
        MarketplaceListing.status == "pending_confirmation"
    ).all()

    for listing in pending_listings:
        sent_at = listing.confirmacao_enviada_em or listing.criado_em
        if sent_at.tzinfo is None:
            sent_at = sent_at.replace(tzinfo=timezone.utc)
        if (now - sent_at) >= timedelta(hours=24):
            # Deletar do banco conforme requisito
            db.delete(listing)
            modified = True

    if modified:
        db.commit()


def map_listing_response(listing: MarketplaceListing, current_user: Optional[User]) -> MarketplaceListingResponse:
    tutor_name = listing.tutor.nome if listing.tutor else "Tutor LivePet"
    tutor_tel = listing.telefone_contato or (listing.tutor.telefone if listing.tutor else None)
    is_owner = bool(current_user and current_user.id == listing.user_id)
    needs_conf = listing.status == "pending_confirmation"

    expired_deadline = None
    if listing.confirmacao_enviada_em:
        sent_at = listing.confirmacao_enviada_em
        if sent_at.tzinfo is None:
            sent_at = sent_at.replace(tzinfo=timezone.utc)
        expired_deadline = sent_at + timedelta(hours=24)

    return MarketplaceListingResponse(
        id=listing.id,
        user_id=listing.user_id,
        pet_id=listing.pet_id,
        titulo=listing.titulo,
        especie=listing.especie,
        raca=listing.raca,
        sexo=listing.sexo,
        idade_meses=listing.idade_meses,
        quantidade=listing.quantidade,
        cidade=listing.cidade,
        tipo=listing.tipo,
        preco=listing.preco,
        pedigree=listing.pedigree,
        pedigree_registro=listing.pedigree_registro,
        descricao=listing.descricao,
        foto_url=listing.foto_url,
        telefone_contato=listing.telefone_contato,
        status=listing.status,
        criado_em=listing.criado_em,
        atualizado_em=listing.atualizado_em,
        confirmacao_enviada_em=listing.confirmacao_enviada_em,
        tutor_nome=tutor_name,
        tutor_telefone=tutor_tel,
        is_owner=is_owner,
        needs_confirmation=needs_conf,
        expired_deadline=expired_deadline,
    )


@router.get(
    "/listings",
    response_model=List[MarketplaceListingResponse],
    summary="Listar anúncios ativos de filhotes cadastrados no banco de dados",
)
def list_listings(
    q: Optional[str] = Query(None, description="Termo de busca"),
    especie: Optional[str] = Query(None, description="Filtro por espécie"),
    tipo: Optional[str] = Query(None, description="Filtro por tipo ('venda' ou 'adocao')"),
    pedigree: Optional[bool] = Query(None, description="Apenas com pedigree"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Lista apenas anúncios reais cadastrados no banco de dados.
    Processa previamente regras de confirmação de 30 dias e expiração de 24h.
    """
    process_listing_lifecycle(db)

    query = db.query(MarketplaceListing).filter(
        MarketplaceListing.status.in_(["active", "pending_confirmation"])
    )

    if especie and especie != "Todas":
        query = query.filter(MarketplaceListing.especie.ilike(f"%{especie}%"))

    if tipo and tipo in ["venda", "adocao"]:
        query = query.filter(MarketplaceListing.tipo == tipo)

    if pedigree:
        query = query.filter(MarketplaceListing.pedigree.is_(True))

    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.filter(
            or_(
                MarketplaceListing.titulo.ilike(term),
                MarketplaceListing.raca.ilike(term),
                MarketplaceListing.cidade.ilike(term),
                MarketplaceListing.descricao.ilike(term),
            )
        )

    results = query.order_by(desc(MarketplaceListing.criado_em)).all()
    return [map_listing_response(item, current_user) for item in results]


@router.get(
    "/my-listings",
    response_model=List[MarketplaceListingResponse],
    summary="Listar todos os anúncios criados pelo usuário autenticado",
)
def get_my_listings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retorna os anúncios criados pelo usuário logado."""
    process_listing_lifecycle(db)
    results = (
        db.query(MarketplaceListing)
        .filter(MarketplaceListing.user_id == current_user.id)
        .order_by(desc(MarketplaceListing.criado_em))
        .all()
    )
    return [map_listing_response(item, current_user) for item in results]


@router.post(
    "/listings",
    response_model=MarketplaceListingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Criar um novo anúncio de filhote/ninhada no banco de dados",
)
def create_listing(
    listing_in: MarketplaceListingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Cria e persiste um novo anúncio de filhote no PostgreSQL/SQLite.
    Vínculo automático com o ID do usuário autenticado.
    """
    listing = MarketplaceListing(
        user_id=current_user.id,
        pet_id=listing_in.pet_id,
        titulo=listing_in.titulo.strip(),
        especie=listing_in.especie.strip(),
        raca=listing_in.raca.strip() if listing_in.raca else None,
        sexo=listing_in.sexo or "Macho",
        idade_meses=listing_in.idade_meses if listing_in.idade_meses is not None else 2,
        quantidade=listing_in.quantidade if listing_in.quantidade is not None else 1,
        cidade=listing_in.cidade.strip() if listing_in.cidade else (current_user.cidade or "Brasil"),
        tipo=listing_in.tipo or ("venda" if (listing_in.preco or 0) > 0 else "adocao"),
        preco=float(listing_in.preco or 0.0),
        pedigree=bool(listing_in.pedigree),
        pedigree_registro=listing_in.pedigree_registro.strip() if listing_in.pedigree_registro else None,
        descricao=listing_in.descricao.strip() if listing_in.descricao else None,
        foto_url=listing_in.foto_url,
        telefone_contato=listing_in.telefone_contato.strip() if listing_in.telefone_contato else current_user.telefone,
        status="active",
    )

    db.add(listing)
    db.commit()
    db.refresh(listing)

    return map_listing_response(listing, current_user)


@router.delete(
    "/listings/{listing_id}",
    status_code=status.HTTP_200_OK,
    summary="Excluir anúncio do banco de dados",
)
def delete_listing(
    listing_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Exclui permanentemente o anúncio do banco de dados.
    Apenas o próprio anunciante tutor pode excluir.
    """
    listing = db.query(MarketplaceListing).filter(MarketplaceListing.id == listing_id).first()
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Anúncio não encontrado.",
        )

    if listing.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para excluir este anúncio.",
        )

    db.delete(listing)
    db.commit()

    return {"message": "Anúncio excluído com sucesso do banco de dados.", "deleted_id": listing_id}


@router.post(
    "/listings/{listing_id}/confirm",
    summary="Responder à confirmação pré-definida de 30 dias (renovar ou encerrar)",
)
def confirm_listing(
    listing_id: int,
    action: MarketplaceConfirmAction,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Confirmação pré-definida para o tutor:
    - 'renovar': mantém o anúncio ativo e renova a contagem de 30 dias.
    - 'encerrar': remove o anúncio do banco de dados (já foi adotado/vendido).
    """
    listing = db.query(MarketplaceListing).filter(MarketplaceListing.id == listing_id).first()
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Anúncio não encontrado ou já expirado.",
        )

    if listing.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas o autor pode confirmar o status do anúncio.",
        )

    now = datetime.now(timezone.utc)

    if action.acao == "renovar":
        listing.status = "active"
        listing.criado_em = now
        listing.atualizado_em = now
        listing.confirmacao_enviada_em = None
        db.commit()
        db.refresh(listing)
        return {
            "status": "renewed",
            "message": "Anúncio renovado com sucesso por mais 30 dias!",
            "listing": map_listing_response(listing, current_user),
        }
    elif action.acao == "encerrar":
        db.delete(listing)
        db.commit()
        return {
            "status": "closed",
            "message": "Anúncio encerrado e excluído com sucesso do catálogo.",
            "deleted_id": listing_id,
        }


@router.post(
    "/listings/{listing_id}/simulate-30-days",
    summary="Ambiente de Testes: simular que o anúncio completou 30 dias e aguarda confirmação",
)
def simulate_30_days(
    listing_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Endpoint utilitário de demonstração e teste: retroage a data de criação em 30 dias
    e dispara a confirmação de 24 horas no chat.
    """
    listing = db.query(MarketplaceListing).filter(MarketplaceListing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Anúncio não encontrado.")

    if listing.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Não autorizado.")

    now = datetime.now(timezone.utc)
    listing.criado_em = now - timedelta(days=31)
    listing.status = "pending_confirmation"
    listing.confirmacao_enviada_em = now
    db.commit()
    db.refresh(listing)

    return {
        "message": "Simulação de 30 dias ativada com sucesso. A confirmação está pendente com prazo de 24h.",
        "listing": map_listing_response(listing, current_user),
    }


@router.post(
    "/listings/{listing_id}/simulate-expire-24h",
    summary="Ambiente de Testes: simular expiração de 24h sem resposta (exclui do banco)",
)
def simulate_expire_24h(
    listing_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Endpoint utilitário de demonstração e teste: retroage a confirmação em 25 horas
    e executa a rotina de exclusão automática do banco.
    """
    listing = db.query(MarketplaceListing).filter(MarketplaceListing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Anúncio não encontrado.")

    if listing.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Não autorizado.")

    now = datetime.now(timezone.utc)
    listing.confirmacao_enviada_em = now - timedelta(hours=25)
    listing.status = "pending_confirmation"
    db.commit()

    # Executa a limpeza
    process_listing_lifecycle(db)

    # Verifica se foi deletado
    check = db.query(MarketplaceListing).filter(MarketplaceListing.id == listing_id).first()
    return {
        "message": "Simulação de 24h concluída.",
        "deleted": check is None,
    }
