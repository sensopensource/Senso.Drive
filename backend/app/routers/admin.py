from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.dependencies import require_admin
from app.models.utilisateurs import Utilisateur
from app.schemas.log import LogListResponse
from app.services import log_service


router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/logs", response_model=LogListResponse)
def list_logs(
    page: int = 1,
    size: int = 50,
    niveau: str | None = None,
    action: str | None = None,
    id_utilisateur: int | None = None,
    date_debut: datetime | None = None,
    date_fin: datetime | None = None,
    _admin: Utilisateur = Depends(require_admin),
    db: Session = Depends(get_db),
) -> LogListResponse:
    return log_service.list_logs(
        db=db,
        page=page,
        size=size,
        niveau=niveau,
        action=action,
        id_utilisateur=id_utilisateur,
        date_debut=date_debut,
        date_fin=date_fin,
    )
