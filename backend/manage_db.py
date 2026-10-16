"""
Script utilitário para gerenciamento, inspeção e execução de migrações no banco de dados (Neon / PostgreSQL / SQLite).
"""

import sys
import os

if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from sqlalchemy import text, inspect
from app.core.database import engine, Base
import app.models  # noqa: F401


def test_connection():
    """Testa a conexão ativa com o banco de dados configurado no .env."""
    print("⏳ Conectando ao banco de dados...")
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version();")).scalar()
            print("✅ Conexão estabelecida com sucesso!")
            print(f"📊 Versão do Banco: {result}")
    except Exception as e:
        # Se for SQLite, version() pode falhar, testar sqlite_version
        try:
            with engine.connect() as conn:
                result = conn.execute(text("SELECT sqlite_version();")).scalar()
                print("✅ Conectado ao SQLite local!")
                print(f"📊 Versão do SQLite: {result}")
        except Exception:
            print("❌ Erro ao conectar ao banco de dados:")
            print(e)
            sys.exit(1)


def list_tables():
    """Lista todas as tabelas e colunas existentes no banco atual."""
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"\n📋 Tabelas encontradas no banco ({len(tables)}):")
    if not tables:
        print("   (Nenhuma tabela encontrada no banco de dados)")
        return

    for table in tables:
        columns = inspector.get_columns(table)
        col_names = [f"{c['name']} ({c['type']})" for c in columns]
        print(f"   • {table}: {', '.join(col_names)}")


def create_all_tables():
    """Cria todas as tabelas mapeadas no SQLAlchemy (Base.metadata)."""
    print("\n⏳ Criando tabelas mapeadas no ORM...")
    Base.metadata.create_all(bind=engine)
    print("✅ Todas as tabelas foram criadas/atualizadas com sucesso!")
    list_tables()


def execute_sql_file(file_path: str):
    """Executa um script .sql diretamente no banco de dados."""
    if not os.path.exists(file_path):
        print(f"❌ Arquivo não encontrado: {file_path}")
        return

    print(f"\n⏳ Executando script SQL: {file_path}...")
    with open(file_path, "r", encoding="utf-8") as f:
        sql_content = f.read()

    # Divide os comandos por ponto e vírgula ignorando linhas vazias
    with engine.begin() as conn:
        for statement in sql_content.split(";"):
            stmt = statement.strip()
            if stmt:
                conn.execute(text(stmt))
    print("✅ Script SQL executado com sucesso!")
    list_tables()


from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.clinic import Clinic


def seed_test_clinic(
    email: str = "clinica@livepet.com.br",
    senha: str = "Clinica123",
    nome: str = "Clínica Veterinária LivePet Teste",
):
    """Cria ou atualiza uma clínica de testes no banco para acesso rápido."""
    # Garante que todas as tabelas existam no banco
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        clinic = db.query(Clinic).filter(Clinic.email == email.lower()).first()
        if not clinic:
            clinic = Clinic(
                nome=nome,
                email=email.lower(),
                senha_hash=get_password_hash(senha),
                crmv="CRMV-SP 12345",
                cnpj="12.345.678/0001-90",
                telefone="(11) 3200-1122",
                whatsapp="(11) 98888-2233",
                endereco="Av. Paulista, 1000 - Bela Vista, São Paulo - SP",
                sobre="Clínica modelo para testes de atendimento, prontuários e agendamentos LivePet.",
            )
            db.add(clinic)
            db.commit()
            db.refresh(clinic)
            print("✅ Clínica de teste criada com sucesso!")
        else:
            clinic.senha_hash = get_password_hash(senha)
            clinic.nome = nome
            db.commit()
            print("✅ Clínica de teste atualizada com sucesso!")

        print(f"   📧 E-mail: {email}")
        print(f"   🔑 Senha:  {senha}")
        print(f"   🏥 Nome:   {clinic.nome}")
        return clinic
    finally:
        db.close()


def sync_db_schema():
    """
    Sincroniza o banco de dados (Neon / PostgreSQL ou SQLite) com os modelos SQLAlchemy:
    1. Cria tabelas mapeadas que ainda não existam.
    2. Compara colunas existentes e adiciona automaticamente colunas ausentes via ALTER TABLE.
    """
    print("\n⏳ Sincronizando esquema do banco com os modelos SQLAlchemy...")
    Base.metadata.create_all(bind=engine)

    inspector = inspect(engine)
    db_tables = inspector.get_table_names()
    dialect = engine.dialect.name
    total_added = 0

    with engine.begin() as conn:
        for table_name, table in Base.metadata.tables.items():
            if table_name not in db_tables:
                continue
            db_cols = {c["name"]: c for c in inspector.get_columns(table_name)}
            for col in table.columns:
                if col.name not in db_cols:
                    col_type = col.type.compile(engine.dialect)
                    if dialect == "postgresql":
                        stmt = f'ALTER TABLE "{table_name}" ADD COLUMN IF NOT EXISTS "{col.name}" {col_type};'
                    else:
                        stmt = f'ALTER TABLE "{table_name}" ADD COLUMN "{col.name}" {col_type};'

                    conn.execute(text(stmt))
                    print(f"   ➕ Adicionada coluna: {table_name}.{col.name} ({col_type})")
                    total_added += 1

    if total_added > 0:
        print(f"✅ Sincronização concluída! {total_added} coluna(s) adicionada(s).")
    else:
        print("✅ Banco de dados 100% sincronizado com todos os modelos do LivePet!")

    list_tables()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso:")
        print("  python manage_db.py test           - Testa a conexão com o banco (Neon/SQLite)")
        print("  python manage_db.py tables         - Lista tabelas e colunas existentes")
        print("  python manage_db.py sync           - Sincroniza tabelas e novas colunas com o ORM")
        print("  python manage_db.py create         - Cria tabelas novas via SQLAlchemy ORM")
        print("  python manage_db.py seed           - Cria usuário de teste para clínica")
        print("  python manage_db.py run-sql <file> - Executa um arquivo .sql")
        sys.exit(0)

    cmd = sys.argv[1].lower()
    if cmd == "test":
        test_connection()
    elif cmd == "tables":
        list_tables()
    elif cmd == "sync":
        sync_db_schema()
    elif cmd == "create":
        create_all_tables()
    elif cmd == "seed":
        seed_test_clinic()
    elif cmd == "run-sql":
        if len(sys.argv) < 3:
            print("❌ Informe o caminho do arquivo .sql")
        else:
            execute_sql_file(sys.argv[2])
    else:
        print(f"❌ Comando desconhecido: {cmd}")

