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
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Falha na comunicação com o banco de dados: {str(exc)}",
        )

    latency_ms = round((time.time() - start_time) * 1000, 2)

    return {
        "status": "healthy",
        "database": db_status,
        "database_latency_ms": latency_ms,
        "version": settings.VERSION,
        "project": settings.PROJECT_NAME,
    }
