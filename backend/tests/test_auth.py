import os
import sys
import unittest
from datetime import timedelta

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_db
from app.core.database import Base
from app.core.security import create_access_token, get_password_hash, verify_password
from app.main import app
from app.models.user import User

# Configura banco de dados SQLite isolado em memória para os testes de autenticação
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


class TestAuthModule(unittest.TestCase):
    """
    Testes de aceitação para o módulo de autenticação e controle de acesso (Issue #17).
    """

    def setUp(self):
        """Cria tabelas limpas para cada teste."""
        Base.metadata.create_all(bind=engine)
        app.dependency_overrides[get_db] = override_get_db
        self.client = TestClient(app)

    def tearDown(self):
        """Descarta as tabelas após cada teste."""
        app.dependency_overrides.pop(get_db, None)
        Base.metadata.drop_all(bind=engine)

    # -------------------------------------------------------------
    # Critério 1: Hash seguro de senhas com bcrypt
    # -------------------------------------------------------------
    def test_passwords_are_stored_as_bcrypt_hashes(self):
        """
        Garante que senhas são armazenadas exclusivamente sob formato de hash bcrypt,
        nunca em texto puro, e que a verificação funciona corretamente.
        """
        plain_password = "minhaSenhaSuperSegura!123"
        hashed = get_password_hash(plain_password)

        # Hash deve ser diferente da senha em texto puro
        self.assertNotEqual(plain_password, hashed)
        # Bcrypt inicia com prefixos padrão $2a$, $2b$ ou $2y$
        self.assertTrue(hashed.startswith(("$2a$", "$2b$", "$2y$")))
        # Verificação com a senha correta deve ser verdadeira
        self.assertTrue(verify_password(plain_password, hashed))
        # Verificação com senha incorreta deve ser falsa
        self.assertFalse(verify_password("senhaErrada", hashed))

        # Cadastro via endpoint salva o hash no banco
        resp = self.client.post(
            "/auth/register",
            json={
                "nome": "Ana Lima",
                "email": "ana@livepet.com",
                "senha": plain_password,
                "telefone": "11988887777",
            },
        )
        self.assertEqual(resp.status_code, 201)

        db = TestingSessionLocal()
        user_db = db.query(User).filter(User.email == "ana@livepet.com").first()
        db.close()

        self.assertIsNotNone(user_db)
        self.assertNotEqual(user_db.senha_hash, plain_password)
        self.assertTrue(user_db.senha_hash.startswith(("$2a$", "$2b$", "$2y$")))
        self.assertTrue(verify_password(plain_password, user_db.senha_hash))

    # -------------------------------------------------------------
    # Critério 2: Endpoint POST /auth/register e e-mails duplicados
    # -------------------------------------------------------------
    def test_register_new_tutor_success(self):
        """
        POST /auth/register deve cadastrar com sucesso retornando HTTP 201,
        sem expor senha ou senha_hash na resposta.
        """
        payload = {
            "nome": "Roberto Carlos",
            "email": "roberto@livepet.com",
            "senha": "senhaValida456",
            "telefone": "21999990000",
        }
        resp = self.client.post("/auth/register", json=payload)
        self.assertEqual(resp.status_code, 201)
        data = resp.json()
        self.assertEqual(data["nome"], "Roberto Carlos")
        self.assertEqual(data["email"], "roberto@livepet.com")
        self.assertEqual(data["telefone"], "21999990000")
        self.assertIn("id", data)
        self.assertNotIn("senha", data)
        self.assertNotIn("senha_hash", data)

    def test_register_duplicate_email_returns_400_bad_request(self):
        """
        POST /auth/register deve recusar e-mails duplicados com status 400 Bad Request
        mesmo com variação de maiúsculas/minúsculas.
        """
        payload = {
            "nome": "Tutor Original",
            "email": "duplicado@livepet.com",
            "senha": "senhaOriginal123",
        }
        resp1 = self.client.post("/auth/register", json=payload)
        self.assertEqual(resp1.status_code, 201)

        # Tentativa de cadastro com o mesmo e-mail (maiúsculo)
        payload_dup = {
            "nome": "Outro Tutor",
            "email": "DUPLICADO@livepet.com",
            "senha": "outraSenha456",
        }
        resp2 = self.client.post("/auth/register", json=payload_dup)
        self.assertEqual(resp2.status_code, 400)
        self.assertIn("Já existe um usuário cadastrado", resp2.json()["detail"])

    # -------------------------------------------------------------
    # Critério 3: Endpoint POST /auth/login e emissão de JWT
    # -------------------------------------------------------------
    def test_login_success_returns_jwt_with_expiration(self):
        """
        POST /auth/login autentica credenciais válidas e retorna token JWT com expiração.
        """
        # Cadastra o usuário
        self.client.post(
            "/auth/register",
            json={
                "nome": "Clara Nunes",
                "email": "clara@livepet.com",
                "senha": "senhaClara123",
            },
        )

        # Realiza login
        resp = self.client.post(
            "/auth/login",
            json={"email": "clara@livepet.com", "senha": "senhaClara123"},
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["token_type"], "bearer")
        self.assertEqual(data["user"]["email"], "clara@livepet.com")

        # Inspeciona o token JWT
        import jwt
        from app.core.config import settings
        decoded = jwt.decode(
            data["access_token"],
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        self.assertIn("sub", decoded)
        self.assertIn("exp", decoded)
        self.assertGreater(decoded["exp"], 0)

    def test_login_invalid_password_returns_401(self):
        """POST /auth/login com senha inválida deve retornar 401 Unauthorized."""
        self.client.post(
            "/auth/register",
            json={"nome": "User 1", "email": "user1@livepet.com", "senha": "correta123"},
        )

        resp = self.client.post(
            "/auth/login",
            json={"email": "user1@livepet.com", "senha": "senhaIncorreta"},
        )
        self.assertEqual(resp.status_code, 401)
        self.assertIn("E-mail ou senha incorretos", resp.json()["detail"])

    def test_login_nonexistent_user_returns_401(self):
        """POST /auth/login com e-mail não cadastrado deve retornar 401 Unauthorized."""
        resp = self.client.post(
            "/auth/login",
            json={"email": "naoexiste@livepet.com", "senha": "qualquerCoisa123"},
        )
        self.assertEqual(resp.status_code, 401)
        self.assertIn("E-mail ou senha incorretos", resp.json()["detail"])

    # -------------------------------------------------------------
    # Critério 4 e 5: Injeção get_current_user e validação de rotas privadas
    # -------------------------------------------------------------
    def test_protected_route_with_valid_token_succeeds(self):
        """
        Rota protegida com header 'Authorization: Bearer <token>' válido
        deve autenticar o tutor e retornar seus dados (HTTP 200).
        """
        reg_resp = self.client.post(
            "/auth/register",
            json={"nome": "Lucas Melo", "email": "lucas@livepet.com", "senha": "senhaLucas123"},
        )
        login_resp = self.client.post(
            "/auth/login",
            json={"email": "lucas@livepet.com", "senha": "senhaLucas123"},
        )
        token = login_resp.json()["access_token"]

        # Rota protegida /auth/me
        resp = self.client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["email"], "lucas@livepet.com")

        # Rota protegida /pets
        pets_resp = self.client.get(
            "/pets",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(pets_resp.status_code, 200)
        self.assertIsInstance(pets_resp.json(), list)

    def test_protected_route_missing_token_returns_401(self):
        """Requisições a rotas protegidas sem cabeçalho Authorization devem ser rejeitadas com 401."""
        resp = self.client.get("/auth/me")
        self.assertEqual(resp.status_code, 401)
        self.assertIn("detail", resp.json())

    def test_protected_route_invalid_token_returns_401(self):
        """Requisições com token malformado ou inválido devem ser rejeitadas com 401."""
        resp = self.client.get(
            "/auth/me",
            headers={"Authorization": "Bearer tokenTotalmenteInvalido123"},
        )
        self.assertEqual(resp.status_code, 401)
        self.assertIn("Token inválido ou expirado", resp.json()["detail"])

    def test_protected_route_expired_token_returns_401(self):
        """Requisições com token JWT expirado devem ser rejeitadas com status 401 Unauthorized."""
        # Cria um token JWT já expirado (diferença negativa)
        expired_token = create_access_token(
            subject=1,
            expires_delta=timedelta(minutes=-10),
        )

        resp = self.client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {expired_token}"},
        )
        self.assertEqual(resp.status_code, 401)
        self.assertIn("Token inválido ou expirado", resp.json()["detail"])

    def test_protected_route_token_with_deleted_user_returns_401(self):
        """Token para usuário que não existe mais no banco de dados deve retornar 401."""
        valid_jwt_for_ghost_user = create_access_token(subject=999999)
        resp = self.client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {valid_jwt_for_ghost_user}"},
        )
        self.assertEqual(resp.status_code, 401)


if __name__ == "__main__":
    unittest.main()
