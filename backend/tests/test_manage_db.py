import manage_db
import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base
from app.models.clinic import Clinic
from app.models.pet import Pet
from app.models.user import User


@pytest.fixture
def cleanup_session_factory():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    @event.listens_for(engine, "connect")
    def enable_foreign_keys(connection, _):
        connection.execute("PRAGMA foreign_keys=ON")

    Base.metadata.create_all(bind=engine)
    testing_session_local = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    try:
        yield testing_session_local
    finally:
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


def test_limpar_ficticios_cli_is_idempotent(cleanup_session_factory, monkeypatch, capsys):
    fictitious_emails = [
        "usuarioteste@livepet.com.br",
        "professor.artur@livepet.com.br",
        "joao.victor@livepet.com.br",
    ]
    with cleanup_session_factory() as db:
        fictitious_users = [
            User(nome=email, email=email, senha_hash="hash")
            for email in fictitious_emails
        ]
        real_user = User(
            nome="Pessoa real",
            email="real@example.com",
            senha_hash="hash",
        )
        db.add_all([*fictitious_users, real_user])
        db.flush()
        db.add_all(
            [
                Pet(user_id=user.id, nome=f"Pet fictício {index}", especie="Cachorro")
                for index, user in enumerate(fictitious_users)
            ]
            + [
                Pet(user_id=real_user.id, nome="Pet real", especie="Gato"),
            ]
        )
        db.add(
            Clinic(
                nome="Clínica teste",
                email="clinica@livepet.com.br",
                senha_hash="hash",
            )
        )
        db.commit()

    monkeypatch.setattr(manage_db, "SessionLocal", cleanup_session_factory)
    monkeypatch.setattr(manage_db.sys, "argv", ["manage_db.py", "limpar-ficticios"])

    manage_db.main()
    first_run_output = capsys.readouterr().out
    manage_db.main()
    second_run_output = capsys.readouterr().out

    assert "Tutores removidos: 3" in first_run_output
    assert "Pets removidos em cascata: 3" in first_run_output
    assert "Clínicas removidas: 1" in first_run_output
    assert "Tutores removidos: 0" in second_run_output
    assert "Pets removidos em cascata: 0" in second_run_output
    assert "Clínicas removidas: 0" in second_run_output

    with cleanup_session_factory() as db:
        assert db.query(User).filter_by(email="real@example.com").count() == 1
        assert db.query(Pet).filter_by(nome="Pet real").count() == 1
        assert db.query(User).filter(User.email.in_(fictitious_emails)).count() == 0
        assert db.query(Pet).filter(Pet.nome.like("Pet fictício %")).count() == 0
        assert db.query(Clinic).filter_by(email="clinica@livepet.com.br").count() == 0
