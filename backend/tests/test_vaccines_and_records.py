import os
import sys
import unittest
from datetime import date

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_db
from app.core.database import Base
from app.main import app

# Configura banco de dados SQLite isolado em memória
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


class TestVaccinesAndRecords(unittest.TestCase):
    """
    Testes de integração para Vacinas e Prontuários Médicos (Issue #19).
    """

    def setUp(self):
        Base.metadata.create_all(bind=engine)
        app.dependency_overrides[get_db] = override_get_db
        self.client = TestClient(app)

        # Cadastro e login do Tutor 1
        resp_reg = self.client.post(
            "/auth/register",
            json={
                "nome": "Juliana Paes",
                "email": "juliana@livepet.com",
                "senha": "senhaSegura123",
                "telefone": "11977778888",
            },
        )
        self.assertEqual(resp_reg.status_code, 201)
        resp_login = self.client.post(
            "/auth/login",
            json={"email": "juliana@livepet.com", "senha": "senhaSegura123"},
        )
        self.token1 = resp_login.json()["access_token"]
        self.headers1 = {"Authorization": f"Bearer {self.token1}"}

        # Cria Pet para o Tutor 1
        resp_pet = self.client.post(
            "/pets",
            headers=self.headers1,
            json={"nome": "Pipoca", "especie": "Gato", "raca": "Siamês", "peso": 4.1},
        )
        self.assertEqual(resp_pet.status_code, 201)
        self.pet1_id = resp_pet.json()["id"]

        # Cadastro e login do Tutor 2
        self.client.post(
            "/auth/register",
            json={
                "nome": "Marcos Silva",
                "email": "marcos@livepet.com",
                "senha": "senhaSegura456",
            },
        )
        resp_login2 = self.client.post(
            "/auth/login",
            json={"email": "marcos@livepet.com", "senha": "senhaSegura456"},
        )
        self.token2 = resp_login2.json()["access_token"]
        self.headers2 = {"Authorization": f"Bearer {self.token2}"}

    def tearDown(self):
        app.dependency_overrides.pop(get_db, None)
        Base.metadata.drop_all(bind=engine)

    def test_vaccine_flow(self):
        # 1. Tutor 1 cadastra vacina para Pipoca
        resp_vac = self.client.post(
            f"/pets/{self.pet1_id}/vaccines",
            headers=self.headers1,
            json={
                "nome": "V5 Felina",
                "data_aplicacao": "2026-03-01",
                "proxima_dose": "2027-03-01",
                "lote": "LOTE-9988",
                "veterinario": "Dr. Fernando",
            },
        )
        self.assertEqual(resp_vac.status_code, 201)
        vac_data = resp_vac.json()
        self.assertEqual(vac_data["nome"], "V5 Felina")
        self.assertEqual(vac_data["pet_id"], self.pet1_id)
        vac_id = vac_data["id"]

        # 2. Tutor 2 tenta cadastrar vacina no pet de Tutor 1 (403 Forbidden)
        resp_unauth = self.client.post(
            f"/pets/{self.pet1_id}/vaccines",
            headers=self.headers2,
            json={
                "nome": "Antirrábica",
                "data_aplicacao": "2026-03-01",
            },
        )
        self.assertEqual(resp_unauth.status_code, 403)

        # 3. Tutor 1 lista as vacinas
        resp_list = self.client.get(
            f"/pets/{self.pet1_id}/vaccines",
            headers=self.headers1,
        )
        self.assertEqual(resp_list.status_code, 200)
        vac_list = resp_list.json()
        self.assertEqual(len(vac_list), 1)
        self.assertEqual(vac_list[0]["id"], vac_id)

        # 4. Tutor 2 tenta listar vacinas de Tutor 1 (403 Forbidden)
        resp_list_unauth = self.client.get(
            f"/pets/{self.pet1_id}/vaccines",
            headers=self.headers2,
        )
        self.assertEqual(resp_list_unauth.status_code, 403)

        # 5. Tutor 1 exclui a vacina
        resp_del = self.client.delete(
            f"/pets/{self.pet1_id}/vaccines/{vac_id}",
            headers=self.headers1,
        )
        self.assertEqual(resp_del.status_code, 204)

        # 6. Lista vazia após exclusão
        resp_empty = self.client.get(
            f"/pets/{self.pet1_id}/vaccines",
            headers=self.headers1,
        )
        self.assertEqual(len(resp_empty.json()), 0)

    def test_medical_records_flow(self):
        # 1. Tutor 1 cadastra prontuário médico
        resp_rec = self.client.post(
            f"/pets/{self.pet1_id}/medical-records",
            headers=self.headers1,
            json={
                "tipo": "Consulta de Rotina",
                "descricao": "Pet em ótimo estado geral, vermifugação em dia.",
                "peso_registrado": 4.25,
            },
        )
        self.assertEqual(resp_rec.status_code, 201)
        rec_data = resp_rec.json()
        self.assertEqual(rec_data["tipo"], "Consulta de Rotina")
        self.assertEqual(rec_data["peso_registrado"], 4.25)
        rec_id = rec_data["id"]

        # 2. Tutor 2 tenta cadastrar prontuário no pet de Tutor 1 (403)
        resp_rec_unauth = self.client.post(
            f"/pets/{self.pet1_id}/medical-records",
            headers=self.headers2,
            json={"tipo": "Cirurgia", "descricao": "Sem autorização"},
        )
        self.assertEqual(resp_rec_unauth.status_code, 403)

        # 3. Tutor 1 lista o prontuário
        resp_list = self.client.get(
            f"/pets/{self.pet1_id}/medical-records",
            headers=self.headers1,
        )
        self.assertEqual(resp_list.status_code, 200)
        records = resp_list.json()
        self.assertEqual(len(records), 1)
        self.assertEqual(records[0]["id"], rec_id)

        # 4. Detalhes do pet /pets/{id} já trazem vaccines e medical_records
        resp_pet_details = self.client.get(
            f"/pets/{self.pet1_id}",
            headers=self.headers1,
        )
        self.assertEqual(resp_pet_details.status_code, 200)
        pet_full = resp_pet_details.json()
        self.assertEqual(len(pet_full["medical_records"]), 1)
        self.assertEqual(pet_full["medical_records"][0]["tipo"], "Consulta de Rotina")

        # 5. Tutor 1 exclui o prontuário
        resp_del = self.client.delete(
            f"/pets/{self.pet1_id}/medical-records/{rec_id}",
            headers=self.headers1,
        )
        self.assertEqual(resp_del.status_code, 204)


if __name__ == "__main__":
    unittest.main()
