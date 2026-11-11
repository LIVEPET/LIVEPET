from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.pet import Pet
from app.models.testimonial import Testimonial
from app.models.user import User
from app.schemas.testimonial import TestimonialCreate, TestimonialOut


router = APIRouter(tags=["Depoimentos"])


def montar_saida(depoimento: Testimonial) -> TestimonialOut:
    """Monta a resposta pública, usando só o nome do tutor."""
    return TestimonialOut(
        id=depoimento.id,
        nome_tutor=depoimento.tutor.nome,
        texto=depoimento.texto,
        criado_em=depoimento.criado_em,
    )


@router.post(
    "/depoimentos",
    response_model=TestimonialOut,
    status_code=status.HTTP_201_CREATED,
    summary="Enviar um depoimento",
)
def criar_depoimento(
    payload: TestimonialCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Cria o depoimento do tutor logado. Ele fica como não aprovado e só
    aparece na listagem pública depois que a líder aprovar.
    Exige pelo menos 1 pet cadastrado e permite 1 depoimento por usuário.
    """
    tem_pet = db.query(Pet).filter(Pet.user_id == current_user.id).first()
    if not tem_pet:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cadastre pelo menos 1 pet para enviar um depoimento.",
        )

    ja_enviou = (
        db.query(Testimonial).filter(Testimonial.user_id == current_user.id).first()
    )
    if ja_enviou:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Você já enviou um depoimento.",
        )

    depoimento = Testimonial(user_id=current_user.id, texto=payload.texto)
    db.add(depoimento)
    db.commit()
    db.refresh(depoimento)

    return montar_saida(depoimento)


@router.get(
    "/depoimentos",
    response_model=List[TestimonialOut],
    summary="Listar depoimentos aprovados",
)
def listar_depoimentos(db: Session = Depends(get_db)):
    """Rota pública: lista só os depoimentos aprovados, dos mais recentes aos mais antigos."""
    depoimentos = (
        db.query(Testimonial)
        .filter(Testimonial.aprovado.is_(True))
        .order_by(Testimonial.criado_em.desc(), Testimonial.id.desc())
        .all()
    )
    return [montar_saida(d) for d in depoimentos]