import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app

engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture
def db_session():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_deploy_headers_on_responses(client):
    """Garante que as respostas da API incluem os headers X-Deploy-Id e X-App-Version para o front."""
    res = client.get("/health")
    assert res.status_code == 200
    assert "x-deploy-id" in res.headers
    assert "x-app-version" in res.headers
    data = res.json()
    assert "deploy_id" in data
    assert "version" in data


def test_version_endpoint(client):
    """Garante que a rota /version responde com o ID do deploy do Render."""
    res = client.get("/version")
    assert res.status_code == 200
    data = res.json()
    assert "deploy_id" in data
    assert "version" in data
