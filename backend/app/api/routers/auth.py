from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    get_client_ip,
    get_password_hash,
    login_rate_limiter,
    register_rate_limiter,
    verify_password,
)
from app.models.user import User
from app.schemas.user import LoginRequest, Token, UserCreate, UserResponse, UserUpdate

router = APIRouter(prefix="/auth", tags=["Autenticação"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Cadastrar novo tutor",
)
def register(request: Request, user_in: UserCreate, db: Session = Depends(get_db)):
    """
    Cadastra um novo tutor com validação de unicidade de e-mail e hash seguro de senha.
    Protegido por rate limiting para mitigar abusos e criação automatizada em massa.
    """
    client_ip = get_client_ip(request)
    if not register_rate_limiter.is_allowed(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Muitas tentativas de cadastro. Por favor, aguarde alguns minutos.",
        )

    existing_user = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Já existe um usuário cadastrado com este e-mail.",
        )

    user = User(
        nome=user_in.nome,
        email=user_in.email.lower(),
        senha_hash=get_password_hash(user_in.senha),
        telefone=user_in.telefone,
    )
    try:
        db.add(user)
        db.commit()
        db.refresh(user)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Já existe um usuário cadastrado com este e-mail.",
        )
    return user


@router.post(
    "/login",
    response_model=Token,
    summary="Autenticar tutor e obter token JWT",
)
def login(request: Request, login_data: LoginRequest, db: Session = Depends(get_db)):
    """
    Autentica um tutor com e-mail e senha, retornando um Bearer token JWT.
    Protegido contra ataques de força bruta por rate limiting por IP.
    """
    client_ip = get_client_ip(request)
    if not login_rate_limiter.is_allowed(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Muitas tentativas de login consecutivas. Por favor, aguarde um minuto.",
        )

    user = db.query(User).filter(User.email == login_data.email.lower()).first()
    if not user or not verify_password(login_data.senha, user.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(subject=user.id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user,
    }


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Consultar dados do tutor autenticado",
)
def get_me(current_user: User = Depends(get_current_user)):
    """Retorna os dados cadastrais do tutor associado ao token JWT ativo."""
    return current_user


@router.put(
    "/me",
    response_model=UserResponse,
    summary="Atualizar dados do perfil do tutor autenticado",
)
def update_me(
    user_in: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Atualiza informações do perfil do tutor autenticado (nome, telefone, foto, cidade, estado, canil, bio).
    Se uma nova senha for fornecida, ela é re-hasheada de forma segura.
    """
    if user_in.nome is not None:
        current_user.nome = user_in.nome
    if user_in.telefone is not None:
        current_user.telefone = user_in.telefone
    if user_in.foto_url is not None:
        current_user.foto_url = user_in.foto_url
    if user_in.cidade is not None:
        current_user.cidade = user_in.cidade
    if user_in.estado is not None:
        current_user.estado = user_in.estado
    if user_in.nome_canil is not None:
        current_user.nome_canil = user_in.nome_canil
    if user_in.bio is not None:
        current_user.bio = user_in.bio
    if user_in.senha is not None and len(user_in.senha) >= 6:
        current_user.senha_hash = get_password_hash(user_in.senha)

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user

