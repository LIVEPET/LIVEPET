from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.lineage import Lineage
from app.models.lineage_request import LineageRequest
from app.models.pet import Pet
from app.models.user import User
from app.schemas.lineage import LineageCreate, LineageResponse
from app.schemas.lineage_request import (
    LineageRequestCreate,
    LineageRequestResponse,
    PetSummary,
)

router = APIRouter(prefix="/lineages", tags=["Linhagem e Pedigree"])


def build_request_response(req: LineageRequest) -> LineageRequestResponse:
    """Monta a resposta enriquecida da solicitação de linhagem com nomes e fotos."""
    return LineageRequestResponse(
        id=req.id,
        filhote_pet_id=req.filhote_pet_id,
        ascendente_pet_id=req.ascendente_pet_id,
        tipo_vinculo=req.tipo_vinculo,
        solicitante_user_id=req.solicitante_user_id,
        solicitado_user_id=req.solicitado_user_id,
        status=req.status,
        mensagem=req.mensagem,
        criado_em=req.criado_em,
        respondido_em=req.respondido_em,
        filhote_nome=req.filhote.nome if req.filhote else None,
        filhote_foto_url=req.filhote.foto_url if req.filhote else None,
        filhote_raca=req.filhote.raca if req.filhote else None,
        ascendente_nome=req.ascendente.nome if req.ascendente else None,
        ascendente_foto_url=req.ascendente.foto_url if req.ascendente else None,
        ascendente_raca=req.ascendente.raca if req.ascendente else None,
        solicitante_nome=req.solicitante.nome if req.solicitante else None,
        solicitado_nome=req.solicitado.nome if req.solicitado else None,
    )


@router.get(
    "/search-by-token/{token}",
    response_model=PetSummary,
    summary="Buscar pet por token público para vinculação de pedigree",
)
def search_pet_by_token(
    token: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Localiza um pet pelo token público oficial (ex: CBKC-XXXXXXXX ou token UUID)
    e retorna seus dados básicos com nome do tutor para confirmação visual.
    """
    token_clean = token.strip()
    if token_clean.upper().startswith("CBKC-"):
        token_clean = token_clean[5:]

    # Busca por token_publico exato ou prefixo
    pet = (
        db.query(Pet)
        .filter(
            (Pet.token_publico.ilike(f"{token_clean}%"))
            | (Pet.token_publico == token_clean)
        )
        .first()
    )

    if not pet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nenhum pet encontrado com este código/token de pedigree.",
        )

    tutor = pet.tutor
    return PetSummary(
        id=pet.id,
        nome=pet.nome,
        especie=pet.especie,
        raca=pet.raca,
        porte=pet.porte,
        sexo=pet.sexo,
        foto_url=pet.foto_url,
        token_publico=pet.token_publico,
        tutor_id=tutor.id if tutor else 0,
        tutor_nome=tutor.nome if tutor else "Tutor LivePet",
        tutor_canil=tutor.nome_canil if tutor else None,
        tutor_cidade=f"{tutor.cidade}, {tutor.estado}" if tutor and tutor.cidade else None,
    )


@router.post(
    "/requests",
    response_model=LineageRequestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Criar solicitação de autorização de paternidade/maternidade",
)
def create_lineage_request(
    req_in: LineageRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Cria uma solicitação formal enviada para o tutor do cão pai/mãe autorizar a filiação.
    """
    # 1. Valida se o filhote pertence ao tutor autenticado
    filhote = db.query(Pet).filter(Pet.id == req_in.filhote_pet_id).first()
    if not filhote:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pet filhote não encontrado.",
        )
    if filhote.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você só pode solicitar pedigree para os seus próprios pets.",
        )

    # 2. Localiza o pet ascendente (por token ou por id)
    ascendente = None
    if req_in.ascendente_token:
        t_clean = req_in.ascendente_token.strip()
        if t_clean.upper().startswith("CBKC-"):
            t_clean = t_clean[5:]
        ascendente = (
            db.query(Pet)
            .filter(
                (Pet.token_publico.ilike(f"{t_clean}%"))
                | (Pet.token_publico == t_clean)
            )
            .first()
        )
    elif req_in.ascendente_pet_id:
        ascendente = db.query(Pet).filter(Pet.id == req_in.ascendente_pet_id).first()

    if not ascendente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pet ascendente (pai/mãe) não encontrado.",
        )

    if ascendente.id == filhote.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Um pet não pode ser pai ou mãe de si mesmo.",
        )

    # 3. Verifica se o ascendente pertence ao mesmo tutor (auto-aprovação instantânea)
    is_same_tutor = ascendente.user_id == current_user.id
    initial_status = "aprovado" if is_same_tutor else "pendente"

    # 4. Verifica se já existe uma solicitação pendente idêntica
    existing = (
        db.query(LineageRequest)
        .filter(
            LineageRequest.filhote_pet_id == filhote.id,
            LineageRequest.ascendente_pet_id == ascendente.id,
            LineageRequest.status == "pendente",
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Já existe uma solicitação pendente para este vínculo genealógico.",
        )

    lineage_req = LineageRequest(
        filhote_pet_id=filhote.id,
        ascendente_pet_id=ascendente.id,
        tipo_vinculo=req_in.tipo_vinculo,
        solicitante_user_id=current_user.id,
        solicitado_user_id=ascendente.user_id,
        status=initial_status,
        mensagem=req_in.mensagem,
        respondido_em=datetime.now(timezone.utc) if is_same_tutor else None,
    )
    db.add(lineage_req)
    db.commit()
    db.refresh(lineage_req)

    # Se pertencer ao próprio tutor, já atualiza a tabela lineages imediatamente
    if is_same_tutor:
        _apply_approved_lineage(db, lineage_req)

    return build_request_response(lineage_req)


@router.get(
    "/requests/received",
    response_model=List[LineageRequestResponse],
    summary="Listar solicitações de linhagem recebidas pelo tutor atual",
)
def get_received_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retorna todas as solicitações em que o tutor atual é dono do pai ou mãe."""
    requests = (
        db.query(LineageRequest)
        .filter(LineageRequest.solicitado_user_id == current_user.id)
        .order_by(LineageRequest.criado_em.desc())
        .all()
    )
    return [build_request_response(r) for r in requests]


@router.get(
    "/requests/sent",
    response_model=List[LineageRequestResponse],
    summary="Listar solicitações de linhagem enviadas pelo tutor atual",
)
def get_sent_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retorna todas as solicitações enviadas pelo tutor para outros pets."""
    requests = (
        db.query(LineageRequest)
        .filter(LineageRequest.solicitante_user_id == current_user.id)
        .order_by(LineageRequest.criado_em.desc())
        .all()
    )
    return [build_request_response(r) for r in requests]


@router.post(
    "/requests/{request_id}/approve",
    response_model=LineageRequestResponse,
    summary="Aprovar solicitação de paternidade/maternidade",
)
def approve_lineage_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Aprova a solicitação e grava o vínculo genealógico verificado na tabela lineages."""
    req = db.query(LineageRequest).filter(LineageRequest.id == request_id).first()
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Solicitação não encontrada.",
        )

    if req.solicitado_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas o tutor dono do pet ascendente pode autorizar este vínculo.",
        )

    req.status = "aprovado"
    req.respondido_em = datetime.now(timezone.utc)
    _apply_approved_lineage(db, req)
    db.commit()
    db.refresh(req)

    return build_request_response(req)


@router.post(
    "/requests/{request_id}/reject",
    response_model=LineageRequestResponse,
    summary="Recusar solicitação de paternidade/maternidade",
)
def reject_lineage_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Recusa a solicitação de paternidade/maternidade."""
    req = db.query(LineageRequest).filter(LineageRequest.id == request_id).first()
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Solicitação não encontrada.",
        )

    if req.solicitado_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas o tutor do pet ascendente pode recusar este vínculo.",
        )

    req.status = "recusado"
    req.respondido_em = datetime.now(timezone.utc)
    db.commit()
    db.refresh(req)

    return build_request_response(req)


@router.get(
    "/pets/{pet_id}",
    response_model=Optional[LineageResponse],
    summary="Consultar a linhagem e pedigree de um pet",
)
def get_pet_lineage(
    pet_id: int,
    db: Session = Depends(get_db),
):
    """Retorna os dados de pedigree de um pet cadastrado."""
    lineage = db.query(Lineage).filter(Lineage.pet_id == pet_id).first()
    return lineage


@router.put(
    "/pets/{pet_id}",
    response_model=LineageResponse,
    summary="Salvar ou atualizar dados de pedigree de um pet",
)
def update_pet_lineage(
    pet_id: int,
    lineage_in: LineageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Salva dados de linhagem e pedigree de um pet pertencente ao tutor autenticado."""
    pet = db.query(Pet).filter(Pet.id == pet_id).first()
    if not pet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pet não encontrado.",
        )
    if pet.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para alterar o pedigree deste animal.",
        )

    lineage = db.query(Lineage).filter(Lineage.pet_id == pet_id).first()
    if not lineage:
        lineage = Lineage(pet_id=pet_id)
        db.add(lineage)

    # Atualiza campos manuais
    data = lineage_in.model_dump(exclude_unset=True, exclude={"pet_id"})
    for field, value in data.items():
        setattr(lineage, field, value)

    db.commit()
    db.refresh(lineage)
    return lineage


def _apply_approved_lineage(db: Session, req: LineageRequest):
    """Aplica o vínculo genealógico aprovado na tabela lineages do filhote."""
    lineage = db.query(Lineage).filter(Lineage.pet_id == req.filhote_pet_id).first()
    if not lineage:
        lineage = Lineage(pet_id=req.filhote_pet_id)
        db.add(lineage)

    ascendente = req.ascendente
    if req.tipo_vinculo == "pai":
        lineage.pai_pet_id = ascendente.id
        lineage.pai_nome = ascendente.nome
        lineage.pai_registro = f"CBKC-{ascendente.token_publico[:8].upper()}" if ascendente.token_publico else f"CBKC-{ascendente.id}"
        lineage.status_verificacao = "aprovado"

        # Se o pai já tiver linhagem com avós paternos cadastrados, herda automaticamente!
        if ascendente.lineage:
            if ascendente.lineage.pai_nome:
                lineage.avo_pat_m_nome = ascendente.lineage.pai_nome
            if ascendente.lineage.mae_nome:
                lineage.avo_pat_f_nome = ascendente.lineage.mae_nome

    elif req.tipo_vinculo == "mae":
        lineage.mae_pet_id = ascendente.id
        lineage.mae_nome = ascendente.nome
        lineage.mae_registro = f"CBKC-{ascendente.token_publico[:8].upper()}" if ascendente.token_publico else f"CBKC-{ascendente.id}"
        lineage.status_verificacao = "aprovado"

        # Se a mãe já tiver linhagem com avós maternos cadastrados, herda automaticamente!
        if ascendente.lineage:
            if ascendente.lineage.pai_nome:
                lineage.avo_mat_m_nome = ascendente.lineage.pai_nome
            if ascendente.lineage.mae_nome:
                lineage.avo_mat_f_nome = ascendente.lineage.mae_nome
