import pytest
from datetime import date, datetime, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError

from app.core.database import Base
from app.models.user import User
from app.models.pet import Pet
from app.models.vaccine import Vaccine
from app.models.medical_record import MedicalRecord


@pytest.fixture
def db_session():
    """Cria uma sessão em memória isolada para cada teste."""
    engine = create_engine("sqlite:///:memory:")
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


def test_create_user(db_session):
    user = User(
        nome="Paulo Silva",
        email="paulo@example.com",
        senha_hash="hashed_secret_123",
        telefone="11999998888",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    assert user.id is not None
    assert user.nome == "Paulo Silva"
    assert user.email == "paulo@example.com"
    assert user.criado_em is not None


def test_user_email_unique(db_session):
    user1 = User(nome="User 1", email="unique@example.com", senha_hash="hash1")
    user2 = User(nome="User 2", email="unique@example.com", senha_hash="hash2")
    db_session.add(user1)
    db_session.commit()

    db_session.add(user2)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


def test_create_pet_and_relationships(db_session):
    user = User(
        nome="Tutor Teste",
        email="tutor@example.com",
        senha_hash="hash_pw",
        telefone="11988887777",
    )
    db_session.add(user)
    db_session.commit()

    pet = Pet(
        user_id=user.id,
        nome="Rex",
        especie="Cachorro",
        raca="Golden Retriever",
        porte="Grande",
        peso=32.5,
        foto_url="https://example.com/rex.jpg",
    )
    db_session.add(pet)
    db_session.commit()
    db_session.refresh(pet)

    assert pet.id is not None
    assert pet.user_id == user.id
    assert pet.token_publico is not None
    assert pet.tutor.email == "tutor@example.com"
    assert len(user.pets) == 1
    assert user.pets[0].nome == "Rex"


def test_vaccine_and_medical_record_cascade(db_session):
    user = User(nome="Tutor", email="tutor_casc@example.com", senha_hash="pw")
    db_session.add(user)
    db_session.commit()

    pet = Pet(user_id=user.id, nome="Pipoca", especie="Gato")
    db_session.add(pet)
    db_session.commit()

    vaccine = Vaccine(
        pet_id=pet.id,
        nome="Antirrábica",
        data_aplicacao=date(2026, 1, 10),
        proxima_dose=date(2027, 1, 10),
        lote="AB1234",
        veterinario="Dr. Carlos",
    )
    record = MedicalRecord(
        pet_id=pet.id,
        tipo="Consulta de Rotina",
        descricao="Pet saudável, vermifugado.",
        peso_registrado=4.2,
    )
    db_session.add_all([vaccine, record])
    db_session.commit()

    assert len(pet.vaccines) == 1
    assert pet.vaccines[0].nome == "Antirrábica"
    assert len(pet.medical_records) == 1
    assert pet.medical_records[0].tipo == "Consulta de Rotina"

    # Test cascade delete: removing pet should remove vaccines and medical records
    db_session.delete(pet)
    db_session.commit()

    assert db_session.query(Vaccine).filter_by(id=vaccine.id).first() is None
    assert db_session.query(MedicalRecord).filter_by(id=record.id).first() is None
