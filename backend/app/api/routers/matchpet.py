from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.pet import Pet
from app.models.pet_swipe import PetSwipe
from app.models.user import User
from app.schemas.pet_swipe import SwipeCreate, SwipeResponse


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