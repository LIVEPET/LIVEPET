from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine
from app.api.routers import health, auth, pets, lineages, marketplace, clinicas
import app.models  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Inicializa as tabelas no banco de dados automaticamente no startup
    Base.metadata.create_all(bind=engine)
    try:
        from sqlalchemy import inspect, text
        inspector = inspect(engine)
        db_tables = inspector.get_table_names()
        dialect = engine.dialect.name
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
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning("Aviso durante sincronização de colunas no startup: %s", e)
    yield


openapi_tags = [
    {
        "name": "Clínicas",
        "description": "Endpoints de autenticação, cadastro e gerenciamento cadastral de clínicas veterinárias parceiras (Issue #59).",
    },
    {
        "name": "Autenticação",
        "description": "Endpoints de registro e login de tutores com emissão de Bearer Token JWT (Issue #17).",
    },
    {
        "name": "Pets",
        "description": "CRUD de animais, vacinas, prontuário médico e rota pública de emergência para leitura de coleira QR Code (Issues #18 e #19).",
    },
    {
        "name": "Lineages",
        "description": "Genealogia, árvores de linhagem e solicitações de validação de pedigree.",
    },
    {
        "name": "Marketplace",
        "description": "Vitrine e anúncios de filhotes para adoção responsável e conexões entre tutores.",
    },
    {
        "name": "Health",
        "description": "Verificação de disponibilidade da API e conectividade com o banco de dados PostgreSQL Neon.",
    },
]

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="API RESTful do Projeto Integrador LivePet para gestão de saúde, vacinas, pedigree, clínicas e QR Code.",
    lifespan=lifespan,
    docs_url=settings.DOCS_URL,
    redoc_url=settings.REDOC_URL,
    openapi_tags=openapi_tags,
)

# Configuração de CORS (Cross-Origin Resource Sharing)
_origins = settings.BACKEND_CORS_ORIGINS
_allow_credentials = "*" not in _origins  # credentials=True não funciona com wildcard

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=_allow_credentials,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
    allow_headers=["Authorization", "Content-Type", "Accept", "X-Deploy-Id", "X-App-Version"],
    expose_headers=["X-Deploy-Id", "X-App-Version"],
)


@app.middleware("http")
async def add_deploy_and_cache_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Deploy-Id"] = settings.DEPLOY_ID
    response.headers["X-App-Version"] = settings.VERSION
    return response


# Inclusão dos roteadores da API
app.include_router(health.router)
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(pets.router, prefix=settings.API_V1_STR)
app.include_router(lineages.router, prefix=settings.API_V1_STR)
app.include_router(marketplace.router, prefix=settings.API_V1_STR)
app.include_router(clinicas.router, prefix=f"{settings.API_V1_STR}/clinicas")

# Disponibiliza também sem o prefixo /api/v1 para flexibilidade
app.include_router(auth.router)
app.include_router(pets.router)
app.include_router(lineages.router)
app.include_router(marketplace.router)

# Rotas específicas de clínicas (Issue #59)
app.include_router(clinicas.router, prefix="/api/clinicas")
app.include_router(clinicas.router, prefix="/clinicas")



@app.get("/", tags=["Root"])
def root():
    """Rota raiz com informações de boas-vindas e atalhos para a documentação."""
    return {
        "message": f"Bem-vindo à {settings.PROJECT_NAME}!",
        "version": settings.VERSION,
        "docs_url": "/docs",
        "healthcheck_url": "/health",
        "endpoints": {
            "pets": f"{settings.API_V1_STR}/pets",
            "auth": f"{settings.API_V1_STR}/auth",
            "clinicas": f"{settings.API_V1_STR}/clinicas",
            "clinicas_register": f"{settings.API_V1_STR}/clinicas/register",
            "clinicas_login": f"{settings.API_V1_STR}/clinicas/login",
            "public_qr": f"{settings.API_V1_STR}/public/pet/{{token_publico}}",
        },
    }
