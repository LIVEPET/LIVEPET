import pytest
from datetime import date, datetime, timezone
from pydantic import ValidationError

from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.schemas.pet import PetCreate, PetUpdate, PetResponse
from app.schemas.vaccine import VaccineCreate, VaccineUpdate, VaccineResponse
from app.schemas.medical_record import (
    MedicalRecordCreate,
    MedicalRecordUpdate,
    MedicalRecordResponse,
)


def test_user_create_valid():
    data = {
        "nome": "João Victor",
        "email": "joao@example.com",
        "senha": "senhaSegura123",
        "telefone": "11987654321",
    }
    user_in = UserCreate(**data)
    assert user_in.nome == "João Victor"
    assert user_in.email == "joao@example.com"
    assert user_in.senha == "senhaSegura123"


def test_user_create_invalid_email_and_short_password():
    # Email inválido deve falhar validação
    with pytest.raises(ValidationError):
        UserCreate(nome="João", email="email-invalido", senha="senhaSegura123")

    # Senha com menos de 6 caracteres deve falhar
    with pytest.raises(ValidationError):
        UserCreate(nome="João", email="joao@example.com", senha="123")


def test_user_response_from_attributes():
    class FakeUserORM:
        id = 1
        nome = "João"
        email = "joao@example.com"
        telefone = "11999998888"
        senha_hash = "secret_hash_not_exposed"
        criado_em = datetime.now(timezone.utc)

    user_resp = UserResponse.model_validate(FakeUserORM())
    assert user_resp.id == 1
    assert user_resp.email == "joao@example.com"
    assert not hasattr(user_resp, "senha_hash")


def test_pet_create_valid_and_invalid():
    # Válido
    pet_in = PetCreate(
        nome="Bob",
        especie="Cachorro",
        raca="Beagle",
        porte="Médio",
        peso=15.0,
    )
    assert pet_in.nome == "Bob"
    assert pet_in.peso == 15.0

    # Inválido: ausência de campos obrigatórios (nome e especie)
    with pytest.raises(ValidationError):
        PetCreate(raca="Beagle")

    # Inválido: peso negativo
    with pytest.raises(ValidationError):
        PetCreate(nome="Bob", especie="Cachorro", peso=-5.0)


def test_pet_response_from_attributes():
    class FakePetORM:
        id = 10
        user_id = 1
        nome = "Mimi"
        especie="Gato"
        raca = "Siamês"
        porte = "Pequeno"
        peso = 3.8
        foto_url = "https://example.com/mimi.jpg"
        token_publico = "token_abc123"

    pet_resp = PetResponse.model_validate(FakePetORM())
    assert pet_resp.id == 10
    assert pet_resp.user_id == 1
    assert pet_resp.token_publico == "token_abc123"
    assert pet_resp.nome == "Mimi"


def test_vaccine_validation():
    # Válido
    vac = VaccineCreate(
        nome="V10",
        data_aplicacao=date(2026, 3, 1),
        proxima_dose=date(2027, 3, 1),
        lote="LT987",
        veterinario="Dra. Ana",
    )
    assert vac.nome == "V10"

    # Ausência de data_aplicacao deve falhar
    with pytest.raises(ValidationError):
        VaccineCreate(nome="V10")


def test_medical_record_validation():
    # Válido
    rec = MedicalRecordCreate(
        tipo="Exame de Sangue",
        descricao="Hemograma completo realizado.",
        peso_registrado=12.4,
    )
    assert rec.tipo == "Exame de Sangue"

    # Ausência de tipo deve falhar
    with pytest.raises(ValidationError):
        MedicalRecordCreate(descricao="Sem tipo especificado")


def test_vaccine_response_from_attributes():
    class FakeVaccineORM:
        id = 5
        pet_id = 10
        nome = "Raiva"
        data_aplicacao = date(2026, 2, 1)
        proxima_dose = date(2027, 2, 1)
        lote = "L99"
        veterinario = "Dr. Silva"

    resp = VaccineResponse.model_validate(FakeVaccineORM())
    assert resp.id == 5
    assert resp.pet_id == 10
    assert resp.nome == "Raiva"


def test_medical_record_response_from_attributes():
    class FakeRecordORM:
        id = 7
        pet_id = 10
        tipo = "Cirurgia"
        descricao = "Castração realizada sem intercorrências"
        peso_registrado = 4.0
        data_registro = datetime(2026, 2, 15, 10, 30, tzinfo=timezone.utc)

    resp = MedicalRecordResponse.model_validate(FakeRecordORM())
    assert resp.id == 7
    assert resp.pet_id == 10
    assert resp.tipo == "Cirurgia"
    assert resp.peso_registrado == 4.0
