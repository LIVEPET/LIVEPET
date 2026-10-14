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
    response_description="Clínica veterinária cadastrada com sucesso",
    responses={
        201: {
            "description": "Clínica criada e registrada com sucesso no banco de dados.",
        },
        400: {
            "description": "E-mail já cadastrado no sistema ou inconsistência nos dados.",
            "content": {
                "application/json": {
                    "example": {"detail": "Já existe uma clínica cadastrada com este e-mail."}
                }
            },
        },
        422: {
            "description": "Erro de validação nos campos informados (ex: senha sem caracteres alfanuméricos ou e-mail inválido).",
        },
        429: {
            "description": "Limite de tentativas de cadastro excedido por IP (Rate Limiting).",
            "content": {
                "application/json": {
                    "example": {"detail": "Muitas tentativas de cadastro. Por favor, aguarde alguns minutos."}
                }
            },
        },
    },
)
def register_clinic(
    request: Request,
    clinic_in: ClinicCreate,
    db: Session = Depends(get_db),
):
    """
    **Cadastra uma nova clínica veterinária ou consultório parceiro no sistema (Issue #59).**

    ### Regras de Negócio e Validações:
    * **Nome da Clínica:** Obrigatório, com no mínimo 2 e no máximo 150 caracteres.
    * **E-mail:** Obrigatório, único em todo o sistema e em formato válido.
    * **Senha:** Mínimo de 6 caracteres, devendo conter obrigatoriamente letras e números. É criptografada com hash seguro `bcrypt` antes de ser persistida.
    * **CRMV e CNPJ:** Opcionais, permitindo identificação profissional do responsável técnico.
    * **Telefone e WhatsApp:** Contatos oficiais para agendamentos e suporte aos tutores.
    * **Segurança:** Protegido por rate limiting por endereço IP contra abusos automatizados.
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
    response_description="Autenticação bem-sucedida com emissão do token JWT Bearer",
    responses={
        200: {
            "description": "Login realizado com sucesso. Retorna o token JWT e dados cadastrais da clínica.",
        },
        401: {
            "description": "Credenciais incorretas (e-mail não encontrado ou senha divergente).",
            "content": {
                "application/json": {
                    "example": {"detail": "E-mail ou senha incorretos."}
                }
            },
        },
        429: {
            "description": "Muitas tentativas de login consecutivas (Proteção contra força bruta).",
            "content": {
                "application/json": {
                    "example": {"detail": "Muitas tentativas de login consecutivas. Por favor, aguarde um minuto."}
                }
            },
        },
    },
)
def login_clinic(
    request: Request,
    login_data: ClinicLogin,
    db: Session = Depends(get_db),
):
    """
    **Autentica a clínica veterinária parceira e gera o Bearer token JWT (Issue #59).**

    O token emitido possui a claim `role: "clinic"` e deve ser incluído no cabeçalho
    `Authorization: Bearer <access_token>` para acessar as rotas protegidas da clínica.
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
    response_description="Dados cadastrais completos da clínica logada",
    responses={
        200: {"description": "Dados da clínica retornados com sucesso."},
        401: {"description": "Token JWT ausente, expirado ou inválido."},
        403: {"description": "Acesso negado (ex: token de tutor utilizado em rota restrita de clínica)."},
    },
)
def get_current_clinic_profile(
    current_clinic: Clinic = Depends(get_current_clinic),
):
    """
    **Consulta os dados cadastrais da clínica veterinária autenticada na sessão atual (Issue #59).**

    Requer envio do Bearer token da clínica no cabeçalho `Authorization`.
    """
    return current_clinic


@router.get(
    "/perfil",
    response_model=ClinicResponse,
    summary="Consultar perfil da clínica autenticada",
    response_description="Alias para consulta do perfil cadastral",
    responses={
        200: {"description": "Perfil da clínica retornado com sucesso."},
        401: {"description": "Token JWT ausente ou inválido."},
    },
)
def get_clinic_profile_alias(
    current_clinic: Clinic = Depends(get_current_clinic),
):
    """
    Alias conveniente para consulta do perfil da clínica autenticada.
    """
    return current_clinic


@router.put(
    "/perfil",
    response_model=ClinicResponse,
    summary="Atualizar dados cadastrais e perfil da clínica autenticada",
    response_description="Perfil da clínica atualizado com sucesso",
    responses={
        200: {"description": "Informações cadastrais atualizadas com sucesso."},
        400: {"description": "Novo e-mail já em uso por outra clínica ou dados inválidos."},
        401: {"description": "Token JWT ausente ou inválido."},
        422: {"description": "Erro de validação dos campos submetidos."},
    },
)
def update_clinic_profile(
    update_data: ClinicUpdate,
    current_clinic: Clinic = Depends(get_current_clinic),
    db: Session = Depends(get_db),
):
    """
    **Atualiza as informações cadastrais e de perfil da clínica autenticada (Issue #59).**

    Permite alteração de nome, telefone, WhatsApp, CRMV, CNPJ, endereço, texto sobre,
    logotipo/foto e senha de acesso. Apenas os campos enviados serão atualizados.
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
