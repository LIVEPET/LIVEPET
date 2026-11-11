from datetime import date

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_db
from app.core.database import Base
from app.main import app
from app.models.clinic import Clinic
from app.models.pet import Pet
from app.models.user import User
from app.models.vaccine import Vaccine


@pytest.fixture
def db_session():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    testing_session_local = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    session = testing_session_local()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture
def client(db_session):
    previous_override = app.dependency_overrides.get(get_db)

    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        if previous_override is None:
            app.dependency_overrides.pop(get_db, None)
        else:
            app.dependency_overrides[get_db] = previous_override


def test_stats_returns_database_counts_without_authentication(client, db_session):
    tutors = [
        User(nome=f"Tutor {index}", email=f"tutor{index}@example.com", senha_hash="hash")
        for index in range(2)
    ]
    db_session.add_all(tutors)
    db_session.flush()

    pets = [
        Pet(user_id=tutors[index % 2].id, nome=f"Pet {index}", especie="Cachorro")
        for index in range(3)
    ]
    db_session.add_all(pets)
    db_session.flush()

    db_session.add_all(
        [
            Vaccine(
                pet_id=pets[index].id,
                nome=f"Vacina {index}",
                data_aplicacao=date(2026, 1, index + 1),
            )
            for index in range(2)
        ]
    )
    db_session.add(
        Clinic(nome="Clínica teste", email="clinica@example.com", senha_hash="hash")
    )
    db_session.commit()

    response = client.get("/api/v1/stats")

    assert response.status_code == 200
    assert response.json() == {
        "tutores": 2,
        "pets": 3,
        "vacinas": 2,
        "clinicas": 1,
    }
    assert all(type(value) is int for value in response.json().values())


def test_stats_is_documented_in_swagger_in_portuguese(client):
    docs_response = client.get("/docs")
    openapi_response = client.get("/openapi.json")

    assert docs_response.status_code == 200
    assert openapi_response.status_code == 200
    operation = openapi_response.json()["paths"]["/api/v1/stats"]["get"]
    assert operation["summary"] == "Consultar estatísticas públicas"
    assert "Estatísticas" in operation["tags"]
