from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.dependencies import require_user
from app.models.utilisateurs import Utilisateur
from app.schemas.preference import DashboardLayout
from app.services import preference_service


router = APIRouter(prefix="/preferences", tags=["preferences"])


@router.get("/dashboard", response_model=DashboardLayout)
def get_dashboard_layout(
    utilisateur: Utilisateur = Depends(require_user),
    db: Session = Depends(get_db),
) -> DashboardLayout:
    preference = preference_service.get_preference(db, utilisateur.id)
    if preference is None:
        return DashboardLayout(layout=None)
    return DashboardLayout(layout=preference.layout)


@router.put("/dashboard", response_model=DashboardLayout)
def set_dashboard_layout(
    payload: DashboardLayout,
    utilisateur: Utilisateur = Depends(require_user),
    db: Session = Depends(get_db),
) -> DashboardLayout:
    preference = preference_service.set_layout(db, utilisateur.id, payload.layout)
    return DashboardLayout(layout=preference.layout)
