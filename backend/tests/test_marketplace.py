from datetime import datetime, timezone, timedelta
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.core.security import create_access_token
from app.main import app
from app.models.user import User
from app.models.marketplace_listing import MarketplaceListing

engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture
def db_session():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def test_user(db_session):
    user = User(
        nome="Anunciante Teste",
        email="anunciante@example.com",
        senha_hash="hashed_pw",
        telefone="11999998888",
        cidade="São Paulo - SP",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def auth_headers(test_user):
    token = create_access_token(test_user.id)
    return {"Authorization": f"Bearer {token}"}


def test_marketplace_empty_initially(client):
    """Garante que inicialmente não há nenhum anúncio/mock fake no catálogo."""
    res = client.get("/api/v1/marketplace/listings")
    assert res.status_code == 200
    assert res.json() == []


def test_create_and_delete_marketplace_listing(client, test_user, auth_headers):
    """Testa criação e exclusão real de um anúncio no banco de dados."""
    payload = {
        "titulo": "Ninhada Border Collie Pura",
        "especie": "Cachorro",
        "raca": "Border Collie",
        "sexo": "Misto",
        "idade_meses": 2,
        "quantidade": 4,
        "cidade": "Campinas - SP",
        "tipo": "venda",
        "preco": 1800.0,
        "pedigree": True,
        "pedigree_registro": "CBKC-12345",
        "descricao": "Filhotes vacinados e vermifugados.",
    }

    create_res = client.post("/api/v1/marketplace/listings", json=payload, headers=auth_headers)
    assert create_res.status_code == 201
    listing = create_res.json()
    assert listing["id"] is not None
    assert listing["titulo"] == payload["titulo"]
    assert listing["preco"] == 1800.0
    assert listing["is_owner"] is True
    assert listing["tutor_nome"] == "Anunciante Teste"

    listing_id = listing["id"]

    # Deve constar na listagem pública
    list_res = client.get("/api/v1/marketplace/listings")
    assert list_res.status_code == 200
    assert len(list_res.json()) == 1

    # Exclusão pelo autor
    del_res = client.delete(f"/api/v1/marketplace/listings/{listing_id}", headers=auth_headers)
    assert del_res.status_code == 200

    # Após exclusão, o catálogo volta a ficar vazio
    list_after = client.get("/api/v1/marketplace/listings")
    assert len(list_after.json()) == 0


def test_30_days_confirmation_and_renewal(client, test_user, auth_headers, db_session):
    """Testa ciclo de 30 dias: confirmação via endpoint predefinido (renovar vs encerrar)."""
    listing = MarketplaceListing(
        user_id=test_user.id,
        titulo="Filhote Spitz Alemão",
        especie="Cachorro",
        raca="Spitz",
        preco=2500.0,
        tipo="venda",
        status="active",
    )
    db_session.add(listing)
    db_session.commit()
    db_session.refresh(listing)

    # Simula 30 dias decorridos
    sim_res = client.post(f"/api/v1/marketplace/listings/{listing.id}/simulate-30-days", headers=auth_headers)
    assert sim_res.status_code == 200
    assert sim_res.json()["listing"]["needs_confirmation"] is True
    assert sim_res.json()["listing"]["status"] == "pending_confirmation"

    # Confirmação pré-definida: "renovar" (sim, ainda está vendendo)
    confirm_res = client.post(
        f"/api/v1/marketplace/listings/{listing.id}/confirm",
        json={"acao": "renovar"},
        headers=auth_headers,
    )
    assert confirm_res.status_code == 200
    assert confirm_res.json()["status"] == "renewed"
    assert confirm_res.json()["listing"]["status"] == "active"
    assert confirm_res.json()["listing"]["needs_confirmation"] is False


def test_24h_unanswered_deletes_listing(client, test_user, auth_headers, db_session):
    """Testa se passar 24 horas da mensagem automática sem resposta deleta o anúncio do banco."""
    listing = MarketplaceListing(
        user_id=test_user.id,
        titulo="Filhote Siamês",
        especie="Gato",
        tipo="adocao",
        preco=0.0,
        status="active",
    )
    db_session.add(listing)
    db_session.commit()
    db_session.refresh(listing)

    # Simula que passaram 24h sem resposta
    sim_expire = client.post(f"/api/v1/marketplace/listings/{listing.id}/simulate-expire-24h", headers=auth_headers)
    assert sim_expire.status_code == 200
    assert sim_expire.json()["deleted"] is True

    # Verifica se sumiu do banco e da listagem
    list_res = client.get("/api/v1/marketplace/listings")
    assert len(list_res.json()) == 0
