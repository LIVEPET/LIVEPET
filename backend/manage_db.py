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


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso:")
        print("  python manage_db.py test           - Testa a conexão")
        print("  python manage_db.py tables         - Lista tabelas e colunas")
        print("  python manage_db.py create         - Cria tabelas via SQLAlchemy ORM")
        print("  python manage_db.py run-sql <file> - Executa um arquivo .sql")
        sys.exit(0)

    cmd = sys.argv[1].lower()
    if cmd == "test":
        test_connection()
    elif cmd == "tables":
        list_tables()
    elif cmd == "create":
        create_all_tables()
    elif cmd == "run-sql":
        if len(sys.argv) < 3:
            print("❌ Informe o caminho do arquivo .sql")
        else:
            execute_sql_file(sys.argv[2])
    else:
        print(f"❌ Comando desconhecido: {cmd}")
