import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_db
from app.core.database import Base
from app.main import app

# Configura banco de dados SQLite isolado em memória para testes
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


class TestClinicasAuthAndProfile(unittest.TestCase):
    """
    Testes de integração para Autenticação e Gerenciamento de Clínicas (Issue #59).
    """

    def setUp(self):
        Base.metadata.create_all(bind=engine)
        app.dependency_overrides[get_db] = override_get_db
        self.client = TestClient(app)

        # Cadastro de uma clínica inicial para testes
        self.clinic_data = {
            "nome": "Clínica Veterinária Vida Animal",
            "email": "contato@vidanimal.com.br",
            "senha": "senhaClinica123",
            "crmv": "SP-12345",
            "cnpj": "12.345.678/0001-90",
            "telefone": "(11) 4567-8900",
            "whatsapp": "(11) 98765-4321",
            "endereco": "Av. Paulista, 1000 - São Paulo, SP",
            "sobre": "Cuidando de animais com amor e tecnologia desde 2015.",
        }
        resp = self.client.post("/api/clinicas/register", json=self.clinic_data)
        self.assertEqual(resp.status_code, 201)
        self.clinic_id = resp.json()["id"]

    def tearDown(self):
        app.dependency_overrides.pop(get_db, None)
        Base.metadata.drop_all(bind=engine)

    def test_register_clinic_success(self):
        new_clinic = {
            "nome": "Pet Care Hospital Veterinário",
            "email": "atendimento@petcare.com.br",
            "senha": "senhaSegura2026",
            "crmv": "RJ-99887",
            "telefone": "(21) 2233-4455",
        }
        resp = self.client.post("/api/clinicas/register", json=new_clinic)
        self.assertEqual(resp.status_code, 201)
        data = resp.json()
        self.assertEqual(data["nome"], new_clinic["nome"])
        self.assertEqual(data["email"], new_clinic["email"])
        self.assertEqual(data["crmv"], new_clinic["crmv"])
        self.assertNotIn("senha", data)
        self.assertNotIn("senha_hash", data)

    def test_register_clinic_duplicate_email(self):
        duplicate = {
            "nome": "Outra Clínica",
            "email": "contato@vidanimal.com.br",  # mesmo email
            "senha": "senhaOutra123",
        }
        resp = self.client.post("/api/clinicas/register", json=duplicate)
        self.assertEqual(resp.status_code, 400)
        self.assertIn("Já existe uma clínica cadastrada com este e-mail", resp.json()["detail"])

    def test_register_clinic_weak_password(self):
        weak = {
            "nome": "Clínica Teste",
            "email": "teste@clinica.com",
            "senha": "apenasletras",  # sem números
        }
        resp = self.client.post("/api/clinicas/register", json=weak)
        self.assertEqual(resp.status_code, 422)

    def test_login_clinic_success(self):
        resp = self.client.post(
            "/api/clinicas/login",
            json={"email": "contato@vidanimal.com.br", "senha": "senhaClinica123"},
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["token_type"], "bearer")
        self.assertEqual(data["clinica"]["id"], self.clinic_id)
        self.assertEqual(data["clinica"]["nome"], self.clinic_data["nome"])

    def test_login_clinic_invalid_password(self):
        resp = self.client.post(
            "/api/clinicas/login",
            json={"email": "contato@vidanimal.com.br", "senha": "senhaIncorreta123"},
        )
        self.assertEqual(resp.status_code, 401)
        self.assertIn("E-mail ou senha incorretos", resp.json()["detail"])

    def test_login_clinic_nonexistent(self):
        resp = self.client.post(
            "/api/clinicas/login",
            json={"email": "inexistente@clinica.com", "senha": "senhaQualquer123"},
        )
        self.assertEqual(resp.status_code, 401)
        self.assertIn("E-mail ou senha incorretos", resp.json()["detail"])

    def test_get_current_clinic_profile(self):
        login_resp = self.client.post(
            "/api/clinicas/login",
            json={"email": "contato@vidanimal.com.br", "senha": "senhaClinica123"},
        )
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        resp = self.client.get("/api/clinicas/me", headers=headers)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["id"], self.clinic_id)
        self.assertEqual(data["crmv"], "SP-12345")
        self.assertEqual(data["whatsapp"], "(11) 98765-4321")

        # Testar também a rota alias /perfil
        alias_resp = self.client.get("/api/clinicas/perfil", headers=headers)
        self.assertEqual(alias_resp.status_code, 200)
        self.assertEqual(alias_resp.json()["id"], self.clinic_id)

    def test_get_clinic_unauthenticated(self):
        resp = self.client.get("/api/clinicas/me")
        self.assertEqual(resp.status_code, 401)

        resp_invalid_token = self.client.get(
            "/api/clinicas/me",
            headers={"Authorization": "Bearer token_invalido_123"},
        )
        self.assertEqual(resp_invalid_token.status_code, 401)

    def test_update_clinic_profile(self):
        login_resp = self.client.post(
            "/api/clinicas/login",
            json={"email": "contato@vidanimal.com.br", "senha": "senhaClinica123"},
        )
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        update_payload = {
            "nome": "Vida Animal - Centro Veterinário 24h",
            "crmv": "SP-99999",
            "telefone": "(11) 4000-8888",
            "sobre": "Atendimento emergencial e clínico especializado 24 horas por dia.",
        }
        resp = self.client.put("/api/clinicas/perfil", headers=headers, json=update_payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["nome"], update_payload["nome"])
        self.assertEqual(data["crmv"], update_payload["crmv"])
        self.assertEqual(data["telefone"], update_payload["telefone"])
        self.assertEqual(data["sobre"], update_payload["sobre"])
        self.assertEqual(data["email"], "contato@vidanimal.com.br")

    def test_update_clinic_email_conflict(self):
        # Cadastra segunda clínica
        self.client.post(
            "/api/clinicas/register",
            json={
                "nome": "Segunda Clínica",
                "email": "segunda@clinica.com",
                "senha": "senhaSegura123",
            },
        )

        login_resp = self.client.post(
            "/api/clinicas/login",
            json={"email": "contato@vidanimal.com.br", "senha": "senhaClinica123"},
        )
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Tenta atualizar email da primeira para o da segunda
        resp = self.client.put(
            "/api/clinicas/perfil",
            headers=headers,
            json={"email": "segunda@clinica.com"},
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn("Este e-mail já está em uso por outra clínica", resp.json()["detail"])

    def test_update_clinic_password(self):
        login_resp = self.client.post(
            "/api/clinicas/login",
            json={"email": "contato@vidanimal.com.br", "senha": "senhaClinica123"},
        )
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        resp = self.client.put(
            "/api/clinicas/perfil",
            headers=headers,
            json={"senha": "novaSenhaSegura456"},
        )
        self.assertEqual(resp.status_code, 200)

        # Login antigo deve falhar
        fail_resp = self.client.post(
            "/api/clinicas/login",
            json={"email": "contato@vidanimal.com.br", "senha": "senhaClinica123"},
        )
        self.assertEqual(fail_resp.status_code, 401)

        # Login com nova senha deve funcionar
        success_resp = self.client.post(
            "/api/clinicas/login",
            json={"email": "contato@vidanimal.com.br", "senha": "novaSenhaSegura456"},
        )
        self.assertEqual(success_resp.status_code, 200)

    def test_endpoints_work_with_both_prefixes(self):
        # Testa endpoint sem /api (/clinicas/login)
        resp_clean = self.client.post(
            "/clinicas/login",
            json={"email": "contato@vidanimal.com.br", "senha": "senhaClinica123"},
        )
        self.assertEqual(resp_clean.status_code, 200)

        # Testa endpoint com /api/clinicas/login
        resp_api = self.client.post(
            "/api/clinicas/login",
            json={"email": "contato@vidanimal.com.br", "senha": "senhaClinica123"},
        )
        self.assertEqual(resp_api.status_code, 200)


if __name__ == "__main__":
    unittest.main()
