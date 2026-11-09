"""Issue #60: exercise the API against isolated SQLite or a disposable PostgreSQL schema."""
import os
import sys
from pathlib import Path
from uuid import uuid4

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool
from sqlalchemy.schema import CreateSchema, DropSchema

from app.core.database import Base, get_db
from app.core.security import create_access_token
from app.main import app
from app.models.clinic import Clinic
from app.models.clinic_appointment import ClinicAppointment
from app.models.clinic_link_request import ClinicPetLinkRequest
from app.models.medical_record import MedicalRecord
from app.models.pet import Pet
from app.models.user import User


@pytest.fixture
def api():
    url = os.getenv("CLINIC_TEST_DATABASE_URL", "sqlite://")
    options = {"poolclass": StaticPool, "connect_args": {"check_same_thread": False}} if url == "sqlite://" else {}
    engine = create_engine(url, **options)
    schema = "test_clinic_" + uuid4().hex if engine.dialect.name == "postgresql" else None
    if schema:
        with engine.begin() as connection:
            connection.execute(CreateSchema(schema))
        engine = engine.execution_options(schema_translate_map={None: schema})
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        db.add_all([Clinic(id=1, nome="Clínica Um", email="one@example.com", senha_hash="unused"),
                    Clinic(id=2, nome="Clínica Dois", email="two@example.com", senha_hash="unused"),
                    User(id=1, nome="Tutor", email="tutor@example.com", senha_hash="unused")])
        db.flush()
        db.add(Pet(id=1, user_id=1, nome="Luna", especie="Gato"))
        db.flush()
        db.add(MedicalRecord(pet_id=1, tipo="Consulta", descricao="Histórico do tutor"))
        db.commit()

    def override_db():
        with Session(engine) as db:
            yield db

    previous = dict(app.dependency_overrides)
    app.dependency_overrides[get_db] = override_db
    client = TestClient(app)
    headers = {"Authorization": "Bearer " + create_access_token(subject=1, role="clinic")}
    payload = dict(pet_name="Luna", species="Gato", tutor="Tutor", phone="11999999999",
                   service="Consulta", date="2026-10-28", time="09:30", pet_id=1, peso=4.2)
    try:
        yield client, headers, payload, engine
    finally:
        client.close()
        app.dependency_overrides.clear()
        app.dependency_overrides.update(previous)
        Base.metadata.drop_all(engine)
        if schema:
            with engine.begin() as connection:
                connection.execute(DropSchema(schema))
        engine.dispose()


def approve(engine):
    with Session(engine) as db:
        db.add(ClinicPetLinkRequest(clinic_id=1, pet_id=1, status="aprovado"))
        db.commit()


def test_catalog_details_and_consent(api):
    client, headers, payload, engine = api
    catalog = client.get("/api/clinicas/pacientes?cadastrados=true", headers=headers).json()
    assert catalog[0]["id"] == 1
    assert "token_publico" not in catalog[0] and "senha_hash" not in catalog[0]
    assert client.get("/api/clinicas/pacientes/1", headers=headers).json()["medical_records"] == []
    assert client.post("/api/clinicas/agendamentos", headers=headers, json=payload).status_code == 403
    approve(engine)
    assert len(client.get("/api/clinicas/pacientes/1", headers=headers).json()["medical_records"]) == 1
    assert client.get("/api/clinicas/pacientes/999", headers=headers).status_code == 404
    assert client.get("/api/clinicas/pacientes?cadastrados=true").status_code == 401
    tutor = {"Authorization": "Bearer " + create_access_token(subject=1)}
    assert client.get("/api/clinicas/pacientes/1", headers=tutor).status_code == 403


def test_schedule_lifecycle_history_and_clinic_isolation(api):
    client, headers, payload, engine = api
    approve(engine)
    created = client.post("/api/clinicas/pacientes/1/atendimentos", headers=headers, json=payload)
    assert created.status_code == 201, created.text
    appointment_id = created.json()["id"]
    assert created.json()["pet_id"] == 1 and created.json()["peso"] == 4.2
    second = client.post("/api/clinicas/agendamentos", headers=headers, json={**payload, "date": "2026-10-29"})
    assert second.status_code == 201
    assert len(client.get("/api/clinicas/agendamentos?data=2026-10-28", headers=headers).json()) == 1
    assert client.get("/api/clinicas/agendamentos?data=invalid", headers=headers).status_code == 422
    assert client.get("/api/clinicas/agendamentos?status=invalid", headers=headers).status_code == 422
    history = client.get("/api/clinicas/pacientes/1/atendimentos", headers=headers).json()
    assert [entry["date"] for entry in history] == ["2026-10-29", "2026-10-28"]
    assert len(client.get("/api/clinicas/pacientes", headers=headers).json()[0]["history"]) == 2
    path = f"/api/clinicas/agendamentos/{appointment_id}"
    updated = client.put(path, headers=headers, json={"time": "11:45", "notes": "Retorno", "status": "Aguardando"})
    assert updated.status_code == 200 and updated.json()["time"] == "11:45"
    assert client.patch(path + "/status", headers=headers, json={"status": "Em atendimento"}).status_code == 200
    other = {"Authorization": "Bearer " + create_access_token(subject=2, role="clinic")}
    assert client.get("/api/clinicas/agendamentos", headers=other).json() == []
    assert client.get("/api/clinicas/pacientes/1/atendimentos", headers=other).json() == []
    for method, endpoint, body in [("put", path, {"notes": "Intrusão"}),
                                   ("patch", path + "/status", {"status": "Cancelado"}),
                                   ("delete", path, None)]:
        assert client.request(method, endpoint, headers=other, **({"json": body} if body else {})).status_code == 404
    with Session(engine) as db:
        stored = db.get(ClinicAppointment, appointment_id)
        assert stored.notes == "Retorno" and stored.status == "Em atendimento"
    assert client.delete(path, headers=headers).status_code == 204
    assert client.delete(path, headers=headers).status_code == 404


def test_missing_pet_mismatched_path_and_invalid_updates(api):
    client, headers, payload, engine = api
    approve(engine)
    assert client.post("/api/clinicas/agendamentos", headers=headers, json=[]).status_code == 422
    assert client.post("/api/clinicas/agendamentos", headers=headers, json={**payload, "pet_id": 999}).status_code == 404
    assert client.post("/api/clinicas/pacientes/999/atendimentos", headers=headers, json=payload).status_code == 422
    created = client.post("/api/clinicas/atendimentos", headers=headers, json=payload).json()
    path = f"/api/clinicas/atendimentos/{created['id']}"
    for update in ({"date": None}, {"status": None}, {"pet_id": 999}, {"time": "invalid"}):
        assert client.put(path, headers=headers, json=update).status_code in (404, 422)
    assert client.patch(path + "/status", headers=headers, json={"status": "unknown"}).status_code == 422


@pytest.mark.parametrize("changes", [{"date": "2026-02-30"}, {"time": "25:00"},
                                   {"status": "Inválido"}, {"service": "   "}, {"phone": None}, {"date": 123}])
def test_invalid_schedule_rejected(api, changes):
    client, headers, payload, _ = api
    assert client.post("/api/clinicas/agendamentos", headers=headers, json={**payload, **changes}).status_code == 422
