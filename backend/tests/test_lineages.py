import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.core.security import create_access_token, get_password_hash
from app.main import app
from app.models.lineage import Lineage
from app.models.lineage_request import LineageRequest
from app.models.pet import Pet
from app.models.user import User

# In-memory SQLite engine for tests
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def tutor_a(db_session):
    """Tutor dono do cão pai (Thor Pai)"""
    user = User(
        nome="Tutor Pai Carlos",
        email="carlos@example.com",
        senha_hash=get_password_hash("senha123"),
        telefone="62988881111",
        cidade="Goiânia",
        estado="GO",
        nome_canil="Canil Vale Verde",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def tutor_b(db_session):
    """Tutor dono do filhote (Rex Filhote)"""
    user = User(
        nome="Tutor Filhote Ana",
        email="ana@example.com",
        senha_hash=get_password_hash("senha123"),
        telefone="62999992222",
        cidade="Anápolis",
        estado="GO",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def pet_pai(db_session, tutor_a):
    pet = Pet(
        user_id=tutor_a.id,
        nome="Maximus Campeão",
        especie="Cachorro",
        raca="Golden Retriever",
        porte="Grande",
        sexo="Macho",
        token_publico="PAI123456789",
    )
    db_session.add(pet)
    db_session.commit()
    db_session.refresh(pet)
    return pet


@pytest.fixture
def pet_filhote(db_session, tutor_b):
    pet = Pet(
        user_id=tutor_b.id,
        nome="Junior Filhote",
        especie="Cachorro",
        raca="Golden Retriever",
        porte="Grande",
        sexo="Macho",
        token_publico="FILHOTE987654",
    )
    db_session.add(pet)
    db_session.commit()
    db_session.refresh(pet)
    return pet


def test_search_pet_by_token(client, tutor_b, pet_pai):
    token_b = create_access_token(tutor_b.id)
    headers = {"Authorization": f"Bearer {token_b}"}

    # Busca pelo token do pai
    response = client.get(f"/api/v1/lineages/search-by-token/{pet_pai.token_publico}", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["nome"] == "Maximus Campeão"
    assert data["tutor_nome"] == "Tutor Pai Carlos"
    assert data["tutor_canil"] == "Canil Vale Verde"


def test_request_and_approve_lineage_flow(client, tutor_a, tutor_b, pet_pai, pet_filhote):
    token_b = create_access_token(tutor_b.id)
    token_a = create_access_token(tutor_a.id)

    # 1. Tutor B envia solicitação de paternidade para pet_pai
    headers_b = {"Authorization": f"Bearer {token_b}"}
    req_payload = {
        "filhote_pet_id": pet_filhote.id,
        "ascendente_token": pet_pai.token_publico,
        "tipo_vinculo": "pai",
        "mensagem": "Olá, cruza realizada em Janeiro de 2026.",
    }
    create_res = client.post("/api/v1/lineages/requests", json=req_payload, headers=headers_b)
    assert create_res.status_code == 201
    req_data = create_res.json()
    assert req_data["status"] == "pendente"
    assert req_data["tipo_vinculo"] == "pai"
    request_id = req_data["id"]

    # 2. Tutor A confere solicitações recebidas
    headers_a = {"Authorization": f"Bearer {token_a}"}
    rec_res = client.get("/api/v1/lineages/requests/received", headers=headers_a)
    assert rec_res.status_code == 200
    received_list = rec_res.json()
    assert len(received_list) == 1
    assert received_list[0]["filhote_nome"] == "Junior Filhote"

    # 3. Tutor A aprova a solicitação
    approve_res = client.post(f"/api/v1/lineages/requests/{request_id}/approve", headers=headers_a)
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == "aprovado"

    # 4. Verifica se a linhagem do filhote foi atualizada no banco
    lineage_res = client.get(f"/api/v1/lineages/pets/{pet_filhote.id}", headers=headers_b)
    assert lineage_res.status_code == 200
    lineage_data = lineage_res.json()
    assert lineage_data["pai_nome"] == "Maximus Campeão"
    assert lineage_data["pai_pet_id"] == pet_pai.id
    assert lineage_data["status_verificacao"] == "aprovado"


def test_reject_lineage_flow(client, tutor_a, tutor_b, pet_pai, pet_filhote):
    token_b = create_access_token(tutor_b.id)
    token_a = create_access_token(tutor_a.id)

    headers_b = {"Authorization": f"Bearer {token_b}"}
    req_payload = {
        "filhote_pet_id": pet_filhote.id,
        "ascendente_token": pet_pai.token_publico,
        "tipo_vinculo": "pai",
    }
    create_res = client.post("/api/v1/lineages/requests", json=req_payload, headers=headers_b)
    request_id = create_res.json()["id"]

    headers_a = {"Authorization": f"Bearer {token_a}"}
    reject_res = client.post(f"/api/v1/lineages/requests/{request_id}/reject", headers=headers_a)
    assert reject_res.status_code == 200
    assert reject_res.json()["status"] == "recusado"
