from datetime import date as date_type
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
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
from app.models.clinic_appointment import ClinicAppointment
from app.models.pet import Pet
from app.schemas.clinic import (
    ClinicCreate,
    ClinicLogin,
    ClinicResponse,
    ClinicToken,
    ClinicUpdate,
)
from app.schemas.clinic_appointment import (
    ClinicAppointmentCreate,
    ClinicAppointmentResponse,
    ClinicAppointmentStatusUpdate,
    ClinicAppointmentUpdate,
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


@router.get(
    "/especies",
    response_model=List[str],
    summary="Listar espécies de pets sincronizadas com o banco de dados",
    response_description="Lista ordenada e deduplicada de espécies cadastradas",
)
def get_clinic_species(db: Session = Depends(get_db)):
    """
    Retorna as espécies de pets disponíveis, mesclando as espécies já cadastradas
    na tabela de Pets com a base padrão recomendada pelo LivePet (Cão, Gato, Ave, etc.).
    """
    default_species = ["Cão", "Gato", "Ave", "Roedor", "Réptil", "Outro"]
    db_species_raw = [
        s[0].strip()
        for s in db.query(Pet.especie).distinct().filter(Pet.especie.isnot(None)).all()
        if s[0] and s[0].strip()
    ]
    # Mapeia/unifica "Cachorro" para "Cão" se desejado, preservando ambos se existirem
    species_set = set(default_species)
    for sp in db_species_raw:
        species_set.add(sp)

    # Ordena mantendo "Cão" e "Gato" no topo
    priority = ["Cão", "Cachorro", "Gato"]
    top = [sp for sp in priority if sp in species_set]
    remaining = sorted(list(species_set - set(top)))
    return top + remaining


@router.get(
    "/atendimentos",
    response_model=List[ClinicAppointmentResponse],
    summary="Listar atendimentos da clínica autenticada",
    response_description="Lista de atendimentos ordenados por data e horário",
)
def list_clinic_appointments(
    data: Optional[str] = Query(None, description="Filtrar por data no formato YYYY-MM-DD"),
    status: Optional[str] = Query(None, description="Filtrar por status do atendimento"),
    current_clinic: Clinic = Depends(get_current_clinic),
    db: Session = Depends(get_db),
):
    """
    Consulta os agendamentos cadastrados para a clínica autenticada.
    Permite filtrar por data e status.
    """
    query = db.query(ClinicAppointment).filter(ClinicAppointment.clinic_id == current_clinic.id)
    if data:
        query = query.filter(ClinicAppointment.date == data)
    if status and status != "Todos":
        query = query.filter(ClinicAppointment.status == status)

    return query.order_by(ClinicAppointment.date.asc(), ClinicAppointment.time.asc()).all()


@router.post(
    "/atendimentos",
    response_model=ClinicAppointmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Cadastrar novo atendimento / agendamento",
    response_description="Atendimento cadastrado com sucesso",
)
def create_clinic_appointment(
    appointment_in: ClinicAppointmentCreate,
    current_clinic: Clinic = Depends(get_current_clinic),
    db: Session = Depends(get_db),
):
    """
    Registra um novo atendimento para a clínica autenticada.
    Se a data não for informada, utiliza a data corrente (hoje).
    """
    appointment_date = appointment_in.date or date_type.today().isoformat()
    appointment = ClinicAppointment(
        clinic_id=current_clinic.id,
        pet_name=appointment_in.pet_name.strip(),
        species=appointment_in.species.strip(),
        breed=appointment_in.breed.strip() if appointment_in.breed else "—",
        tutor=appointment_in.tutor.strip(),
        phone=appointment_in.phone.strip(),
        service=appointment_in.service.strip(),
        vet=appointment_in.vet.strip() if appointment_in.vet else "Equipe da clínica",
        date=appointment_date,
        time=appointment_in.time.strip(),
        status=appointment_in.status.strip() if appointment_in.status else "Confirmado",
        notes=appointment_in.notes.strip() if appointment_in.notes else None,
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment


@router.patch(
    "/atendimentos/{appointment_id}/status",
    response_model=ClinicAppointmentResponse,
    summary="Atualizar status do atendimento",
)
def update_appointment_status(
    appointment_id: int,
    status_update: ClinicAppointmentStatusUpdate,
    current_clinic: Clinic = Depends(get_current_clinic),
    db: Session = Depends(get_db),
):
    """
    Atualiza o status de um atendimento da clínica (ex.: 'Em atendimento', 'Concluído', 'Cancelado').
    """
    appointment = (
        db.query(ClinicAppointment)
        .filter(
            ClinicAppointment.id == appointment_id,
            ClinicAppointment.clinic_id == current_clinic.id,
        )
        .first()
    )
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Atendimento não encontrado.",
        )

    appointment.status = status_update.status
    db.commit()
    db.refresh(appointment)
    return appointment


@router.delete(
    "/atendimentos/{appointment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remover atendimento da clínica",
)
def delete_clinic_appointment(
    appointment_id: int,
    current_clinic: Clinic = Depends(get_current_clinic),
    db: Session = Depends(get_db),
):
    """
    Exclui um atendimento da clínica autenticada.
    """
    appointment = (
        db.query(ClinicAppointment)
        .filter(
            ClinicAppointment.id == appointment_id,
            ClinicAppointment.clinic_id == current_clinic.id,
        )
        .first()
    )
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Atendimento não encontrado.",
        )

    db.delete(appointment)
    db.commit()
    return None


@router.get(
    "/pacientes",
    summary="Listar pacientes únicos atendidos pela clínica",
    response_description="Lista de pacientes com histórico e dados cadastrais",
)
def list_clinic_patients(
    current_clinic: Clinic = Depends(get_current_clinic),
    db: Session = Depends(get_db),
):
    """
    Retorna a lista de pacientes únicos atendidos pela clínica com base nos atendimentos registrados.
    """
    appointments = (
        db.query(ClinicAppointment)
        .filter(ClinicAppointment.clinic_id == current_clinic.id)
        .order_by(ClinicAppointment.date.desc(), ClinicAppointment.time.desc())
        .all()
    )
    seen = set()
    patients = []
    for a in appointments:
        key = (a.pet_name.strip().lower(), a.tutor.strip().lower())
        if key not in seen:
            seen.add(key)
            patients.append({
                "id": str(a.id),
                "name": a.pet_name,
                "species": a.species,
                "breed": a.breed or "—",
                "age": "—",
                "weight": "—",
                "tutor": a.tutor,
                "phone": a.phone or "—",
                "photo": None,
                "alerts": [],
                "vaccinesUpToDate": None,
                "lastVisit": f"{a.date} · {a.time}",
                "history": [
                    {
                        "date": a.date,
                        "type": a.service,
                        "vet": a.vet,
                        "summary": a.notes or f"Atendimento {a.status.lower()}",
                    }
                ],
            })
    return patients


