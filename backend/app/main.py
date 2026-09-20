from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine
from app.api.routers import health


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Inicializa as tabelas no banco de dados automaticamente no startup
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="API RESTful do Projeto Integrador LivePet para gestão de saúde, vacinas, pedigree e QR Code.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configuração de CORS (Cross-Origin Resource Sharing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusão dos roteadores da API
app.include_router(health.router)


@app.get("/", tags=["Root"])
def root():
    """Rota raiz com informações de boas-vindas e atalhos para a documentação."""
    return {
        "message": f"Bem-vindo à {settings.PROJECT_NAME}!",
        "version": settings.VERSION,
        "docs_url": "/docs",
        "healthcheck_url": "/health",
    }
