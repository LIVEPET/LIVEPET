from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.pet import Pet
from app.models.pet_swipe import PetSwipe
from app.models.user import User
from app.schemas.pet_swipe import MatchResponse, SwipeCreate, SwipeItem, SwipeResponse


router = APIRouter(tags=["MatchPet"])

ACOES_POSITIVAS = ("like", "super_like")


def get_pet_do_usuario(db: Session, pet_id: int, user: User) -> Pet:
    """Busca o pet e garante que ele pertence ao usuário logado."""
    pet = db.query(Pet).filter(Pet.id == pet_id).first()
    if not pet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pet não encontrado.",
        )
    if pet.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Este pet não pertence a você.",
        )
    return pet


def existe_curtida(db: Session, origem_id: int, destino_id: int) -> bool:
    """Diz se o pet de origem curtiu (like ou super_like) o pet de destino."""
    curtida = (
        db.query(PetSwipe)
        .filter(
            PetSwipe.pet_origem_id == origem_id,
            PetSwipe.pet_destino_id == destino_id,
            PetSwipe.acao.in_(ACOES_POSITIVAS),
        )
        .first()
    )
    return curtida is not None


@router.post(
    "/pets/{pet_id}/swipes",
    response_model=SwipeResponse,
    summary="Registrar curtida, super curtida ou passe de um pet sobre outro",
)
def registrar_swipe(
    pet_id: int,
    payload: SwipeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Registra a ação do pet do usuário logado sobre outro pet.
    Se já existir uma ação sobre esse pet, ela é atualizada.
    A resposta informa se houve match (os dois pets se curtiram).
    """
    pet_origem = get_pet_do_usuario(db, pet_id, current_user)

    pet_destino = db.query(Pet).filter(Pet.id == payload.pet_destino_id).first()
    if not pet_destino:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pet de destino não encontrado.",
        )
    if pet_destino.user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Você não pode agir sobre um pet seu.",
        )

    swipe = (
        db.query(PetSwipe)
        .filter(
            PetSwipe.pet_origem_id == pet_origem.id,
            PetSwipe.pet_destino_id == pet_destino.id,
        )
        .first()
    )
    if swipe:
        swipe.acao = payload.acao
    else:
        swipe = PetSwipe(
            pet_origem_id=pet_origem.id,
            pet_destino_id=pet_destino.id,
            acao=payload.acao,
        )
        db.add(swipe)
    db.commit()
    db.refresh(swipe)

    houve_match = payload.acao in ACOES_POSITIVAS and existe_curtida(
        db, pet_destino.id, pet_origem.id
    )

    return SwipeResponse(
        pet_origem_id=swipe.pet_origem_id,
        pet_destino_id=swipe.pet_destino_id,
        acao=swipe.acao,
        match=houve_match,
        criado_em=swipe.criado_em,
    )


@router.delete(
    "/pets/{pet_id}/swipes/{pet_destino_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Desfazer a ação de um pet sobre outro",
)
def desfazer_swipe(
    pet_id: int,
    pet_destino_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove a ação (like, super_like ou pass) do pet sobre o pet de destino."""
    pet_origem = get_pet_do_usuario(db, pet_id, current_user)

    swipe = (
        db.query(PetSwipe)
        .filter(
            PetSwipe.pet_origem_id == pet_origem.id,
            PetSwipe.pet_destino_id == pet_destino_id,
        )
        .first()
    )
    if not swipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nenhuma ação registrada sobre esse pet.",
        )

    db.delete(swipe)
    db.commit()


@router.delete(
    "/pets/{pet_id}/swipes",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Reiniciar o histórico de ações de um pet",
)
def reiniciar_historico(
    pet_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Apaga todas as ações feitas por esse pet (não afeta as de outros pets)."""
    pet_origem = get_pet_do_usuario(db, pet_id, current_user)

    db.query(PetSwipe).filter(PetSwipe.pet_origem_id == pet_origem.id).delete(
        synchronize_session=False
    )
    db.commit()


@router.get(
    "/pets/{pet_id}/swipes",
    response_model=List[SwipeItem],
    summary="Listar os pets já vistos por um pet",
)
def listar_swipes(
    pet_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lista as ações do pet, da mais recente à mais antiga."""
    pet_origem = get_pet_do_usuario(db, pet_id, current_user)

    return (
        db.query(PetSwipe)
        .filter(PetSwipe.pet_origem_id == pet_origem.id)
        .order_by(PetSwipe.criado_em.desc(), PetSwipe.id.desc())
        .all()
    )


@router.get(
    "/pets/{pet_id}/matches",
    response_model=List[MatchResponse],
    summary="Listar os pets com match",
)
def listar_matches(
    pet_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Lista os pets com match: os que o pet curtiu e que também o curtiram.
    Os dados de contato do tutor só aparecem aqui, para pets com match.
    """
    pet = get_pet_do_usuario(db, pet_id, current_user)

    ids_que_curti = [
        linha.pet_destino_id
        for linha in db.query(PetSwipe.pet_destino_id).filter(
            PetSwipe.pet_origem_id == pet.id,
            PetSwipe.acao.in_(ACOES_POSITIVAS),
        )
    ]
    if not ids_que_curti:
        return []

    pets_com_match = (
        db.query(Pet)
        .join(PetSwipe, PetSwipe.pet_origem_id == Pet.id)
        .filter(
            PetSwipe.pet_destino_id == pet.id,
            PetSwipe.acao.in_(ACOES_POSITIVAS),
            Pet.id.in_(ids_que_curti),
        )
        .order_by(Pet.id)
        .all()
    )

    return [
        MatchResponse(
            pet_id=p.id,
            nome=p.nome,
            especie=p.especie,
            raca=p.raca,
            foto_url=p.foto_url,
            tutor_id=p.tutor.id,
            tutor_nome=p.tutor.nome,
            tutor_cidade=p.tutor.cidade,
            tutor_telefone=p.tutor.telefone,
        )
        for p in pets_com_match
    ]