import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.core.security import create_access_token, get_password_hash
from app.main import app
from app.models.pet import Pet
from app.models.testimonial import Testimonial
from app.models.user import User

# Banco SQLite em memória, só para estes testes
engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def criar_tutor(db, nome, email):
    user = User(
        nome=nome,
        email=email,
        senha_hash=get_password_hash("senha123"),
        telefone="11999999999",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def criar_pet(db, tutor, nome):
    pet = Pet(user_id=tutor.id, nome=nome, especie="Cachorro")
    db.add(pet)
    db.commit()
    db.refresh(pet)
    return pet


def auth(tutor):
    return {"Authorization": f"Bearer {create_access_token(tutor.id)}"}


@pytest.fixture
def tutor_ana(db_session):
    tutor = criar_tutor(db_session, "Ana", "ana@example.com")
    criar_pet(db_session, tutor, "Mel")
    return tutor


@pytest.fixture
def tutor_bruno(db_session):
    tutor = criar_tutor(db_session, "Bruno", "bruno@example.com")
    criar_pet(db_session, tutor, "Thor")
    return tutor


@pytest.fixture
def tutor_sem_pet(db_session):
    return criar_tutor(db_session, "Carla", "carla@example.com")


def enviar(client, tutor, texto="A LIVEPET me ajudou muito!"):
    return client.post("/api/v1/depoimentos", json={"texto": texto}, headers=auth(tutor))


def test_criar_depoimento(client, tutor_ana):
    res = enviar(client, tutor_ana)
    assert res.status_code == 201
    data = res.json()
    assert data["nome_tutor"] == "Ana"
    assert data["texto"] == "A LIVEPET me ajudou muito!"
    assert "id" in data
    assert "criado_em" in data


def test_criar_exige_login(client):
    res = client.post("/api/v1/depoimentos", json={"texto": "Ótimo!"})
    assert res.status_code == 401


def test_criar_exige_pet_cadastrado(client, tutor_sem_pet):
    res = enviar(client, tutor_sem_pet)
    assert res.status_code == 400


def test_um_depoimento_por_usuario(client, db_session, tutor_ana):
    enviar(client, tutor_ana, "Primeiro")
    res = enviar(client, tutor_ana, "Segundo")
    assert res.status_code == 409

    total = db_session.query(Testimonial).filter(Testimonial.user_id == tutor_ana.id).count()
    assert total == 1


def test_texto_vazio_ou_grande_demais(client, tutor_ana):
    assert enviar(client, tutor_ana, "").status_code == 422
    assert enviar(client, tutor_ana, "a" * 281).status_code == 422


def test_texto_com_280_caracteres_e_aceito(client, tutor_ana):
    assert enviar(client, tutor_ana, "a" * 280).status_code == 201


def test_novo_depoimento_nasce_nao_aprovado(client, db_session, tutor_ana):
    enviar(client, tutor_ana)
    depoimento = db_session.query(Testimonial).first()
    assert depoimento.aprovado is False


def test_listar_e_publico_e_vazio_no_inicio(client):
    res = client.get("/api/v1/depoimentos")
    assert res.status_code == 200
    assert res.json() == []


def test_listar_nao_mostra_depoimento_pendente(client, tutor_ana):
    enviar(client, tutor_ana)
    res = client.get("/api/v1/depoimentos")
    assert res.status_code == 200
    assert res.json() == []


def test_listar_mostra_so_aprovados_dos_mais_novos_aos_mais_antigos(
    client, db_session, tutor_ana, tutor_bruno, tutor_sem_pet
):
    enviar(client, tutor_ana, "Da Ana")
    enviar(client, tutor_bruno, "Do Bruno")
    db_session.add(Testimonial(user_id=tutor_sem_pet.id, texto="Da Carla"))
    db_session.commit()

    # A líder aprova só os da Ana e do Bruno
    for depoimento in db_session.query(Testimonial).all():
        depoimento.aprovado = depoimento.user_id != tutor_sem_pet.id
    db_session.commit()

    res = client.get("/api/v1/depoimentos")
    assert res.status_code == 200
    textos = [item["texto"] for item in res.json()]
    assert textos == ["Do Bruno", "Da Ana"]


def test_resposta_nao_expoe_email_nem_telefone(client, db_session, tutor_ana):
    enviar(client, tutor_ana)
    db_session.query(Testimonial).update({"aprovado": True})
    db_session.commit()

    publica = client.get("/api/v1/depoimentos").json()[0]
    assert set(publica.keys()) == {"id", "nome_tutor", "texto", "criado_em"}

    criada = db_session.query(Testimonial).first()
    assert "ana@example.com" not in str(publica)
    assert "11999999999" not in str(publica)
    assert criada.tutor.email == "ana@example.com"


def test_usuario_unico_no_banco(db_session, tutor_ana):
    db_session.add(Testimonial(user_id=tutor_ana.id, texto="Um"))
    db_session.commit()

    db_session.add(Testimonial(user_id=tutor_ana.id, texto="Dois"))
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()