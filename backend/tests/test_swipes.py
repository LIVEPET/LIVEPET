import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.core.security import create_access_token, get_password_hash
from app.main import app
from app.models.pet import Pet
from app.models.pet_swipe import PetSwipe
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
    user = User(nome=nome, email=email, senha_hash=get_password_hash("senha123"))
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
    return criar_tutor(db_session, "Ana", "ana@example.com")


@pytest.fixture
def tutor_bruno(db_session):
    return criar_tutor(db_session, "Bruno", "bruno@example.com")


@pytest.fixture
def mel(db_session, tutor_ana):
    return criar_pet(db_session, tutor_ana, "Mel")


@pytest.fixture
def mel_2(db_session, tutor_ana):
    return criar_pet(db_session, tutor_ana, "Luna")


@pytest.fixture
def thor(db_session, tutor_bruno):
    return criar_pet(db_session, tutor_bruno, "Thor")


def swipe(client, tutor, pet_origem, pet_destino_id, acao):
    return client.post(
        f"/api/v1/pets/{pet_origem.id}/swipes",
        json={"pet_destino_id": pet_destino_id, "acao": acao},
        headers=auth(tutor),
    )


def test_curtir_sem_match(client, tutor_ana, mel, thor):
    res = swipe(client, tutor_ana, mel, thor.id, "like")
    assert res.status_code == 200
    data = res.json()
    assert data["acao"] == "like"
    assert data["pet_origem_id"] == mel.id
    assert data["pet_destino_id"] == thor.id
    assert data["match"] is False


def test_match_quando_os_dois_se_curtem(client, tutor_ana, tutor_bruno, mel, thor):
    primeira = swipe(client, tutor_ana, mel, thor.id, "like")
    assert primeira.json()["match"] is False

    segunda = swipe(client, tutor_bruno, thor, mel.id, "like")
    assert segunda.status_code == 200
    assert segunda.json()["match"] is True


def test_super_like_tambem_gera_match(client, tutor_ana, tutor_bruno, mel, thor):
    swipe(client, tutor_ana, mel, thor.id, "super_like")
    res = swipe(client, tutor_bruno, thor, mel.id, "like")
    assert res.json()["match"] is True


def test_passar_nao_gera_match(client, tutor_ana, tutor_bruno, mel, thor):
    swipe(client, tutor_ana, mel, thor.id, "like")
    res = swipe(client, tutor_bruno, thor, mel.id, "pass")
    assert res.status_code == 200
    assert res.json()["match"] is False


def test_repetir_acao_atualiza_sem_duplicar(client, db_session, tutor_ana, mel, thor):
    swipe(client, tutor_ana, mel, thor.id, "like")
    res = swipe(client, tutor_ana, mel, thor.id, "pass")
    assert res.status_code == 200
    assert res.json()["acao"] == "pass"

    linhas = db_session.query(PetSwipe).filter(PetSwipe.pet_origem_id == mel.id).all()
    assert len(linhas) == 1
    assert linhas[0].acao == "pass"


def test_pet_de_origem_precisa_ser_do_usuario(client, tutor_ana, tutor_bruno, mel, thor):
    # O Bruno tenta agir usando a Mel, que é da Ana
    res = swipe(client, tutor_bruno, mel, thor.id, "like")
    assert res.status_code == 403


def test_pet_de_destino_inexistente(client, tutor_ana, mel):
    res = swipe(client, tutor_ana, mel, 99999, "like")
    assert res.status_code == 404


def test_nao_pode_agir_sobre_pet_proprio(client, tutor_ana, mel, mel_2):
    res = swipe(client, tutor_ana, mel, mel_2.id, "like")
    assert res.status_code == 400


def test_acao_invalida(client, tutor_ana, mel, thor):
    res = swipe(client, tutor_ana, mel, thor.id, "dislike")
    assert res.status_code == 422


def test_exige_login(client, mel, thor):
    res = client.post(
        f"/api/v1/pets/{mel.id}/swipes",
        json={"pet_destino_id": thor.id, "acao": "like"},
    )
    assert res.status_code == 401


def test_desfazer_remove_a_acao_e_o_match(
    client, db_session, tutor_ana, tutor_bruno, mel, thor
):
    swipe(client, tutor_ana, mel, thor.id, "like")

    res = client.delete(
        f"/api/v1/pets/{mel.id}/swipes/{thor.id}", headers=auth(tutor_ana)
    )
    assert res.status_code == 204

    linhas = db_session.query(PetSwipe).filter(PetSwipe.pet_origem_id == mel.id).all()
    assert linhas == []

    # Sem a curtida da Mel, o Thor curtir a Mel não gera match
    res = swipe(client, tutor_bruno, thor, mel.id, "like")
    assert res.json()["match"] is False


def test_desfazer_acao_inexistente(client, tutor_ana, mel, thor):
    res = client.delete(
        f"/api/v1/pets/{mel.id}/swipes/{thor.id}", headers=auth(tutor_ana)
    )
    assert res.status_code == 404


def test_desfazer_exige_pet_do_usuario(client, tutor_ana, tutor_bruno, mel, thor):
    swipe(client, tutor_ana, mel, thor.id, "like")

    # O Bruno tenta desfazer usando a Mel, que é da Ana
    res = client.delete(
        f"/api/v1/pets/{mel.id}/swipes/{thor.id}", headers=auth(tutor_bruno)
    )
    assert res.status_code == 403


def test_reiniciar_apaga_so_o_historico_do_pet(
    client, db_session, tutor_ana, mel, mel_2, thor
):
    swipe(client, tutor_ana, mel, thor.id, "like")
    swipe(client, tutor_ana, mel_2, thor.id, "like")

    res = client.delete(f"/api/v1/pets/{mel.id}/swipes", headers=auth(tutor_ana))
    assert res.status_code == 204

    da_mel = db_session.query(PetSwipe).filter(PetSwipe.pet_origem_id == mel.id).all()
    da_luna = (
        db_session.query(PetSwipe).filter(PetSwipe.pet_origem_id == mel_2.id).all()
    )
    assert da_mel == []
    assert len(da_luna) == 1


def test_reiniciar_exige_pet_do_usuario(client, tutor_bruno, mel):
    res = client.delete(f"/api/v1/pets/{mel.id}/swipes", headers=auth(tutor_bruno))
    assert res.status_code == 403


def test_listar_vistos(client, db_session, tutor_ana, tutor_bruno, mel, thor):
    rex = criar_pet(db_session, tutor_bruno, "Rex")
    swipe(client, tutor_ana, mel, thor.id, "like")
    swipe(client, tutor_ana, mel, rex.id, "pass")

    res = client.get(f"/api/v1/pets/{mel.id}/swipes", headers=auth(tutor_ana))
    assert res.status_code == 200
    vistos = {item["pet_destino_id"]: item["acao"] for item in res.json()}
    assert vistos == {thor.id: "like", rex.id: "pass"}


def test_listar_vistos_vazio(client, tutor_ana, mel):
    res = client.get(f"/api/v1/pets/{mel.id}/swipes", headers=auth(tutor_ana))
    assert res.status_code == 200
    assert res.json() == []


def test_listar_vistos_exige_pet_do_usuario(client, tutor_bruno, mel):
    res = client.get(f"/api/v1/pets/{mel.id}/swipes", headers=auth(tutor_bruno))
    assert res.status_code == 403


def test_listar_matches_com_contato_do_tutor(
    client, db_session, tutor_ana, tutor_bruno, mel, thor
):
    tutor_bruno.telefone = "11999999999"
    db_session.commit()

    swipe(client, tutor_ana, mel, thor.id, "like")
    swipe(client, tutor_bruno, thor, mel.id, "super_like")

    res = client.get(f"/api/v1/pets/{mel.id}/matches", headers=auth(tutor_ana))
    assert res.status_code == 200
    dados = res.json()
    assert len(dados) == 1
    assert dados[0]["pet_id"] == thor.id
    assert dados[0]["nome"] == "Thor"
    assert dados[0]["tutor_nome"] == "Bruno"
    assert dados[0]["tutor_telefone"] == "11999999999"

    # O match também aparece do outro lado
    res = client.get(f"/api/v1/pets/{thor.id}/matches", headers=auth(tutor_bruno))
    assert [m["pet_id"] for m in res.json()] == [mel.id]


def test_curtida_sem_retorno_nao_e_match(client, tutor_ana, mel, thor):
    swipe(client, tutor_ana, mel, thor.id, "like")

    res = client.get(f"/api/v1/pets/{mel.id}/matches", headers=auth(tutor_ana))
    assert res.status_code == 200
    assert res.json() == []


def test_passar_nao_gera_match_na_lista(
    client, tutor_ana, tutor_bruno, mel, thor
):
    swipe(client, tutor_ana, mel, thor.id, "like")
    swipe(client, tutor_bruno, thor, mel.id, "pass")

    res = client.get(f"/api/v1/pets/{mel.id}/matches", headers=auth(tutor_ana))
    assert res.json() == []


def test_listar_matches_exige_pet_do_usuario(client, tutor_bruno, mel):
    res = client.get(f"/api/v1/pets/{mel.id}/matches", headers=auth(tutor_bruno))
    assert res.status_code == 403