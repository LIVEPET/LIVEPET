from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.clinic import Clinic
from app.models.pet import Pet
from app.models.user import User
from app.models.vaccine import Vaccine

router = APIRouter(tags=["Estatísticas"])


@router.get("/stats", summary="Consultar estatísticas públicas")
def get_stats(db: Session = Depends(get_db)):
    return {
        "tutores": int(db.query(func.count(User.id)).scalar()),
        "pets": int(db.query(func.count(Pet.id)).scalar()),
        "vacinas": int(db.query(func.count(Vaccine.id)).scalar()),
        "clinicas": int(db.query(func.count(Clinic.id)).scalar()),
    }
