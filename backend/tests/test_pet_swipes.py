import pytest
from sqlalchemy import create_engine
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.user import User
from app.models.pet import Pet
from app.models.pet_swipe import PetSwipe


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


def criar_dois_pets(db):
    user = User(nome="Tutor", email="tutor@example.com", senha_hash="hash")
    db.add(user)
    db.commit()
    mel = Pet(user_id=user.id, nome="Mel", especie="Cachorro")
    thor = Pet(user_id=user.id, nome="Thor", especie="Cachorro")
    db.add_all([mel, thor])
    db.commit()
    return mel, thor


def test_criar_swipe(db_session):
    mel, thor = criar_dois_pets(db_session)
    swipe = PetSwipe(pet_origem_id=mel.id, pet_destino_id=thor.id, acao="like")
    db_session.add(swipe)
    db_session.commit()
    db_session.refresh(swipe)

    assert swipe.id is not None
    assert swipe.acao == "like"
    assert swipe.criado_em is not None


def test_par_de_pets_unico(db_session):
    mel, thor = criar_dois_pets(db_session)
    db_session.add(PetSwipe(pet_origem_id=mel.id, pet_destino_id=thor.id, acao="like"))
    db_session.commit()

    db_session.add(PetSwipe(pet_origem_id=mel.id, pet_destino_id=thor.id, acao="pass"))
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


def test_pet_nao_age_sobre_si_mesmo(db_session):
    mel, _ = criar_dois_pets(db_session)
    db_session.add(PetSwipe(pet_origem_id=mel.id, pet_destino_id=mel.id, acao="like"))
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


def test_acao_invalida(db_session):
    mel, thor = criar_dois_pets(db_session)
    db_session.add(PetSwipe(pet_origem_id=mel.id, pet_destino_id=thor.id, acao="dislike"))
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()