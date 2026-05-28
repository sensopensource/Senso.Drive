from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.dependencies import require_user
from app.models import Utilisateur
from app.services import dashboard_service
from app.schemas.dashboard import DashboardUtilisateur

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardUtilisateur)
def get_dashboard(db: Session = Depends(get_db),
                  current_user: Utilisateur = Depends(require_user)):
    return dashboard_service.get_dashboard_utilisateur(db=db, id_utilisateur=current_user.id)
