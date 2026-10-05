import time
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.core.config import settings

router = APIRouter(tags=["Health"])


@router.get("/health", summary="Verificação de integridade da API e Banco de Dados")
def health_check(db: Session = Depends(get_db)):
    """Verifica se a API está online e se a conexão com o banco de dados está operando."""
    start_time = time.time()
    try:
        # Testa a conectividade com o banco de dados
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as exc:
        import logging
        logging.getLogger("uvicorn.error").error(f"Erro no healthcheck do banco de dados: {exc}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Serviço temporariamente indisponível. Tente novamente em instantes.",
        )

    latency_ms = round((time.time() - start_time) * 1000, 2)

    return {
        "status": "healthy",
        "database": db_status,
        "database_latency_ms": latency_ms,
        "version": settings.VERSION,
        "deploy_id": settings.DEPLOY_ID,
        "project": settings.PROJECT_NAME,
    }


@router.get("/version", summary="Consulta a versão e ID do deploy ativo no Render")
def get_version():
    """Retorna os dados de build e deploy atual para sincronização de cache do navegador."""
    return {
        "version": settings.VERSION,
        "deploy_id": settings.DEPLOY_ID,
        "project": settings.PROJECT_NAME,
    }
