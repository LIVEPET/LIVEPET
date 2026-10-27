import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app

# Configuração de banco de teste isolado em memória
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    app.dependency_overrides[get_db] = override_get_db
    yield
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()


@pytest.fixture
def client():
    return TestClient(app)


def test_pet_microchip_crud(client):
    # 1. Registrar tutor
    tutor_payload = {
        "nome": "Tutor Microchip",
        "email": "tutor.microchip@teste.com",
        "senha": "SenhaForte123",
        "telefone": "(11) 98765-4321",
    }
    r = client.post("/api/v1/auth/register", json=tutor_payload)
    assert r.status_code == 201

    login_r = client.post("/api/v1/auth/login", json={"email": tutor_payload["email"], "senha": tutor_payload["senha"]})
    assert login_r.status_code == 200
    token = login_r.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Criar pet COM microchip
    pet_payload = {
        "nome": "Rex Chip",
        "especie": "Cachorro",
        "raca": "Pastor Alemão",
        "microchip": "981098123456789",
    }
    res = client.post("/api/v1/pets", json=pet_payload, headers=headers)
    assert res.status_code == 201
    pet_data = res.json()
    assert pet_data["microchip"] == "981098123456789"
    pet_id = pet_data["id"]
    token_publico = pet_data["token_publico"]

    # 3. Consultar pet via ID
    res = client.get(f"/api/v1/pets/{pet_id}", headers=headers)
    assert res.status_code == 200
    assert res.json()["microchip"] == "981098123456789"

    # 4. Atualizar microchip
    res = client.put(f"/api/v1/pets/{pet_id}", json={"microchip": "999000111222333"}, headers=headers)
    assert res.status_code == 200
    assert res.json()["microchip"] == "999000111222333"

    # 5. Consultar rota pública do QR Code
    res = client.get(f"/api/v1/public/pet/{token_publico}")
    assert res.status_code == 200
    assert res.json()["microchip"] == "999000111222333"


def test_veterinarios_crud_flow(client):
    # 1. Registrar clínica
    clinic_payload = {
        "nome": "Clínica Veterinária Central",
        "email": "central@vetclinic.com",
        "senha": "ClinicaForte123",
        "cnpj": "12.345.678/0001-99",
        "telefone": "(11) 3333-4444",
    }
    r = client.post("/api/v1/clinicas/register", json=clinic_payload)
    assert r.status_code == 201

    login_r = client.post("/api/v1/clinicas/login", json={"email": clinic_payload["email"], "senha": clinic_payload["senha"]})
    assert login_r.status_code == 200
    login_data = login_r.json()
    token = login_data["access_token"]
    clinic_info = login_data.get("clinica") or login_data.get("clinic")
    clinic_id = clinic_info["id"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Cadastrar veterinário
    vet_payload = {
        "nome": "Dra. Juliana Mendes",
        "crmv": "CRMV-SP 54321",
        "especialidade": "Dermatologia e Cirurgia Geral",
        "telefone": "(11) 97777-8888",
        "email": "juliana.mendes@vetclinic.com",
        "ativo": True,
    }
    res = client.post("/api/v1/clinicas/veterinarios", json=vet_payload, headers=headers)
    assert res.status_code == 201
    vet_data = res.json()
    assert vet_data["nome"] == "Dra. Juliana Mendes"
    assert vet_data["crmv"] == "CRMV-SP 54321"
    assert vet_data["clinic_id"] == clinic_id
    vet_id = vet_data["id"]

    # 3. Listar veterinários da clínica
    res = client.get("/api/v1/clinicas/veterinarios", headers=headers)
    assert res.status_code == 200
    vets = res.json()
    assert len(vets) >= 1
    assert any(v["id"] == vet_id for v in vets)

    # 4. Obter detalhes do veterinário
    res = client.get(f"/api/v1/clinicas/veterinarios/{vet_id}", headers=headers)
    assert res.status_code == 200
    assert res.json()["especialidade"] == "Dermatologia e Cirurgia Geral"

    # 5. Atualizar dados do veterinário
    update_payload = {
        "especialidade": "Dermatologia Avançada",
        "telefone": "(11) 96666-5555",
    }
    res = client.put(f"/api/v1/clinicas/veterinarios/{vet_id}", json=update_payload, headers=headers)
    assert res.status_code == 200
    assert res.json()["especialidade"] == "Dermatologia Avançada"
    assert res.json()["telefone"] == "(11) 96666-5555"

    # 6. Consultar rota pública de veterinários da clínica
    res = client.get(f"/api/v1/clinicas/publicas/{clinic_id}/veterinarios")
    assert res.status_code == 200
    public_vets = res.json()
    assert any(v["id"] == vet_id for v in public_vets)

    # 7. Excluir veterinário
    res = client.delete(f"/api/v1/clinicas/veterinarios/{vet_id}", headers=headers)
    assert res.status_code == 204

    # 8. Confirmar que não existe mais
    res = client.get(f"/api/v1/clinicas/veterinarios/{vet_id}", headers=headers)
    assert res.status_code == 404
