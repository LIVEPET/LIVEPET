import pytest
from fastapi import FastAPI, Depends, status
from fastapi.testclient import TestClient
from app.schemas.user import UserCreate, UserResponse
from app.schemas.pet import PetCreate, PetResponse
from app.schemas.vaccine import VaccineCreate, VaccineResponse
from app.schemas.medical_record import MedicalRecordCreate, MedicalRecordResponse

test_app = FastAPI()


@test_app.post("/test/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user_route(payload: UserCreate):
    return {
        "id": 1,
        "nome": payload.nome,
        "email": payload.email,
        "telefone": payload.telefone,
        "criado_em": "2026-09-25T12:00:00Z",
    }


@test_app.post("/test/pets", response_model=PetResponse, status_code=status.HTTP_201_CREATED)
def create_pet_route(payload: PetCreate):
    return {
        "id": 1,
        "user_id": payload.user_id or 1,
        "nome": payload.nome,
        "especie": payload.especie,
        "raca": payload.raca,
        "porte": payload.porte,
        "peso": payload.peso,
        "foto_url": payload.foto_url,
        "token_publico": payload.token_publico or "fake_token",
    }


client = TestClient(test_app)


def test_api_rejects_missing_fields_with_422():
    # Enviar payload vazio para /test/users deve retornar 422
    response = client.post("/test/users", json={})
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    data = response.json()
    assert "detail" in data


def test_api_rejects_invalid_types_with_422():
    # Enviar email inválido e tipos incorretos deve retornar 422
    invalid_payload = {
        "nome": 12345,  # tipo não string ou fora do esperado
        "email": "not-an-email",
        "senha": "short",
    }
    response = client.post("/test/users", json=invalid_payload)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    errors = response.json().get("detail", [])
    assert len(errors) > 0


def test_api_accepts_valid_payload_with_201():
    valid_payload = {
        "nome": "Carlos Silva",
        "email": "carlos@example.com",
        "senha": "senhaValida123",
        "telefone": "11987654321",
    }
    response = client.post("/test/users", json=valid_payload)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["id"] == 1
    assert data["email"] == "carlos@example.com"
    assert "senha" not in data
    assert "senha_hash" not in data
