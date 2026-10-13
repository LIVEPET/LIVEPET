from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_clinic
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    get_client_ip,
    get_password_hash,
    login_rate_limiter,
    register_rate_limiter,
    verify_password,
)
from app.models.clinic import Clinic
from app.schemas.clinic import (
    ClinicCreate,
    ClinicLogin,
    ClinicResponse,
    ClinicToken,
    ClinicUpdate,
)

router = APIRouter(tags=["Clínicas"])


@router.post(
    "/register",
    response_model=ClinicResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Cadastrar nova clínica veterinária",
)
def register_clinic(
    request: Request,
    clinic_in: ClinicCreate,
    db: Session = Depends(get_db),
):
    """
    Cadastra uma nova clínica veterinária no sistema com validação de unicidade de e-mail
    e hash seguro de senha (Issue #59).
    """
    client_ip = get_client_ip(request)
    if not register_rate_limiter.is_allowed(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Muitas tentativas de cadastro. Por favor, aguarde alguns minutos.",
        )

    existing = db.query(Clinic).filter(Clinic.email == clinic_in.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Já existe uma clínica cadastrada com este e-mail.",
        )

    clinic = Clinic(
        nome=clinic_in.nome,
        email=clinic_in.email.lower(),
        senha_hash=get_password_hash(clinic_in.senha),
        crmv=clinic_in.crmv,
        cnpj=clinic_in.cnpj,
        telefone=clinic_in.telefone,
        whatsapp=clinic_in.whatsapp,
        endereco=clinic_in.endereco,
        sobre=clinic_in.sobre,
        foto_url=clinic_in.foto_url,
    )
    try:
        db.add(clinic)
        db.commit()
        db.refresh(clinic)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Erro ao cadastrar clínica. Verifique os dados fornecidos.",
        )
    return clinic


@router.post(
    "/login",
    response_model=ClinicToken,
    summary="Autenticar clínica veterinária e obter token JWT",
)
def login_clinic(
    request: Request,
    login_data: ClinicLogin,
    db: Session = Depends(get_db),
):
    """
    Autentica a clínica veterinária com e-mail e senha, retornando um Bearer token JWT (Issue #59).
    Protegido contra ataques de força bruta por rate limiting por IP.
    """
    client_ip = get_client_ip(request)
    if not login_rate_limiter.is_allowed(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Muitas tentativas de login consecutivas. Por favor, aguarde um minuto.",
        )

    clinic = db.query(Clinic).filter(Clinic.email == login_data.email.lower()).first()
    if not clinic or not verify_password(login_data.senha, clinic.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(subject=clinic.id, role="clinic")
    return {
        "access_token": token,
        "token_type": "bearer",
        "clinica": clinic,
    }


@router.get(
    "/me",
    response_model=ClinicResponse,
    summary="Consultar dados da clínica autenticada",
)
def get_current_clinic_profile(
    current_clinic: Clinic = Depends(get_current_clinic),
):
    """
    Retorna os dados cadastrais da clínica autenticada na sessão atual (Issue #59).
    """
    return current_clinic


@router.get(
    "/perfil",
    response_model=ClinicResponse,
    summary="Consultar perfil da clínica autenticada",
)
def get_clinic_profile_alias(
    current_clinic: Clinic = Depends(get_current_clinic),
):
    """
    Alias para consulta do perfil da clínica autenticada.
    """
    return current_clinic


@router.put(
    "/perfil",
    response_model=ClinicResponse,
    summary="Atualizar dados cadastrais e perfil da clínica autenticada",
)
def update_clinic_profile(
    update_data: ClinicUpdate,
    current_clinic: Clinic = Depends(get_current_clinic),
    db: Session = Depends(get_db),
):
    """
    Atualiza as informações de perfil e contato da clínica autenticada (Issue #59).
    """
    if update_data.email and update_data.email.lower() != current_clinic.email.lower():
        existing = db.query(Clinic).filter(Clinic.email == update_data.email.lower()).first()
        if existing and existing.id != current_clinic.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Este e-mail já está em uso por outra clínica.",
            )
        current_clinic.email = update_data.email.lower()

    if update_data.nome is not None:
        current_clinic.nome = update_data.nome
    if update_data.crmv is not None:
        current_clinic.crmv = update_data.crmv
    if update_data.cnpj is not None:
        current_clinic.cnpj = update_data.cnpj
    if update_data.telefone is not None:
        current_clinic.telefone = update_data.telefone
    if update_data.whatsapp is not None:
        current_clinic.whatsapp = update_data.whatsapp
    if update_data.endereco is not None:
        current_clinic.endereco = update_data.endereco
    if update_data.sobre is not None:
        current_clinic.sobre = update_data.sobre
    if update_data.foto_url is not None:
        current_clinic.foto_url = update_data.foto_url
    if update_data.senha:
        current_clinic.senha_hash = get_password_hash(update_data.senha)

    db.commit()
    db.refresh(current_clinic)
    return current_clinic
