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
from app.models.medical_record import MedicalRecord
from app.models.pet import Pet

# Configura banco de dados SQLite isolado em memória para os testes
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


app.dependency_overrides[get_db] = override_get_db


class TestPetsCRUD(unittest.TestCase):
    def setUp(self):
        """Cria as tabelas limpas para cada teste."""
        Base.metadata.create_all(bind=engine)
        self.client = TestClient(app)

    def tearDown(self):
        """Limpa as tabelas após cada teste."""
        Base.metadata.drop_all(bind=engine)

    def test_full_pets_crud_and_public_qr_flow(self):
        # 1. Cadastra Tutor 1
        resp_reg1 = self.client.post(
            "/api/v1/auth/register",
            json={
                "nome": "Carlos Silva",
                "email": "carlos@livepet.com",
                "senha": "senhaSegura123",
                "telefone": "(62) 98888-1111",
            },
        )
        self.assertEqual(resp_reg1.status_code, 201)
        user1_data = resp_reg1.json()
        self.assertEqual(user1_data["email"], "carlos@livepet.com")

        # 2. Login Tutor 1
        resp_login1 = self.client.post(
            "/api/v1/auth/login",
            json={"email": "carlos@livepet.com", "senha": "senhaSegura123"},
        )
        self.assertEqual(resp_login1.status_code, 200)
        token1 = resp_login1.json()["access_token"]
        headers1 = {"Authorization": f"Bearer {token1}"}

        # 3. Cadastra Tutor 2
        resp_reg2 = self.client.post(
            "/api/v1/auth/register",
            json={
                "nome": "Mariana Souza",
                "email": "mariana@livepet.com",
                "senha": "senhaSegura456",
                "telefone": "(62) 97777-2222",
            },
        )
        self.assertEqual(resp_reg2.status_code, 201)
        resp_login2 = self.client.post(
            "/api/v1/auth/login",
            json={"email": "mariana@livepet.com", "senha": "senhaSegura456"},
        )
        token2 = resp_login2.json()["access_token"]
        headers2 = {"Authorization": f"Bearer {token2}"}

        # 4. POST /pets: Tutor 1 cadastra o pet 'Thor'
        resp_pet1 = self.client.post(
            "/api/v1/pets",
            headers=headers1,
            json={
                "nome": "Thor",
                "especie": "Cachorro",
                "raca": "Golden Retriever",
                "porte": "Grande",
                "sexo": "Macho",
                "peso": 32.5,
                "cor": "Dourado",
            },
        )
        self.assertEqual(resp_pet1.status_code, 201)
        pet1_data = resp_pet1.json()
        self.assertEqual(pet1_data["nome"], "Thor")
        self.assertEqual(pet1_data["user_id"], user1_data["id"])
        self.assertIsNotNone(pet1_data["token_publico"])
        self.assertGreaterEqual(len(pet1_data["token_publico"]), 32)
        pet1_id = pet1_data["id"]
        token_publico = pet1_data["token_publico"]

        # 5. GET /pets: Tutor 1 lista seus pets e vê 'Thor'
        resp_list1 = self.client.get("/api/v1/pets", headers=headers1)
        self.assertEqual(resp_list1.status_code, 200)
        self.assertEqual(len(resp_list1.json()), 1)
        self.assertEqual(resp_list1.json()[0]["nome"], "Thor")

        # 6. GET /pets: Tutor 2 lista seus pets e NÃO vê o pet de Tutor 1
        resp_list2 = self.client.get("/api/v1/pets", headers=headers2)
        self.assertEqual(resp_list2.status_code, 200)
        self.assertEqual(len(resp_list2.json()), 0)

        # 7. Controle de Acesso: Tutor 2 tenta ver o pet do Tutor 1 (403 Forbidden)
        resp_get_unauthorized = self.client.get(f"/api/v1/pets/{pet1_id}", headers=headers2)
        self.assertEqual(resp_get_unauthorized.status_code, 403)

        # 8. Controle de Acesso: Tutor 2 tenta alterar o pet do Tutor 1 (403 Forbidden)
        resp_put_unauthorized = self.client.put(
            f"/api/v1/pets/{pet1_id}",
            headers=headers2,
            json={"nome": "Thor Alterado"},
        )
        self.assertEqual(resp_put_unauthorized.status_code, 403)

        # 9. PUT /pets/{id}: Tutor 1 atualiza seu próprio pet
        resp_update = self.client.put(
            f"/api/v1/pets/{pet1_id}",
            headers=headers1,
            json={"peso": 34.0, "porte": "Grande"},
        )
        self.assertEqual(resp_update.status_code, 200)
        self.assertEqual(resp_update.json()["peso"], 34.0)

        # 10. GET /public/pet/{token_publico}: Rota pública de emergência SEM autenticação
        db = TestingSessionLocal()
        rec = MedicalRecord(
            pet_id=pet1_id,
            tipo="Alergia",
            descricao="Alérgico severo a Dipirona e picada de abelha.",
        )
        db.add(rec)
        db.commit()
        db.close()

        resp_public = self.client.get(f"/api/v1/public/pet/{token_publico}")
        self.assertEqual(resp_public.status_code, 200)
        pub_data = resp_public.json()
        self.assertEqual(pub_data["nome"], "Thor")
        self.assertEqual(pub_data["especie"], "Cachorro")
        self.assertEqual(pub_data["tutor_nome"], "Carlos Silva")
        self.assertEqual(pub_data["tutor_telefone"], "(62) 98888-1111")
        self.assertIn("Alérgico severo a Dipirona", pub_data["avisos_medicos"])

        # 11. Teste de QR Code público com token inexistente (404)
        resp_not_found = self.client.get("/api/v1/public/pet/token-inexistente-12345")
        self.assertEqual(resp_not_found.status_code, 404)

        # 12. GET /pets/{id}/qrcode: Tutor obtém metadados para gravação da tag
        resp_qr = self.client.get(f"/api/v1/pets/{pet1_id}/qrcode", headers=headers1)
        self.assertEqual(resp_qr.status_code, 200)
        qr_data = resp_qr.json()
        self.assertEqual(qr_data["token_publico"], token_publico)
        self.assertIn(token_publico, qr_data["public_scan_url"])

        # 13. DELETE /pets/{id}: Tutor 2 tenta deletar pet do Tutor 1 (403 Forbidden)
        resp_del_unauth = self.client.delete(f"/api/v1/pets/{pet1_id}", headers=headers2)
        self.assertEqual(resp_del_unauth.status_code, 403)

        # 14. DELETE /pets/{id}: Tutor 1 deleta seu próprio pet (204 No Content)
        resp_del = self.client.delete(f"/api/v1/pets/{pet1_id}", headers=headers1)
        self.assertEqual(resp_del.status_code, 204)

        # 15. Confirma exclusão na listagem
        resp_list_after = self.client.get("/api/v1/pets", headers=headers1)
        self.assertEqual(len(resp_list_after.json()), 0)


if __name__ == "__main__":
    unittest.main()
