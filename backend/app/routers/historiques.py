from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.models.utilisateurs import Utilisateur
from app.core.dependencies import require_user
from app.schemas.historique import HistoriqueRechercheCreate, HistoriqueRechercheRead
from app.services import historique_service
from app.database import get_db

router = APIRouter(prefix="/historiques", tags=["historiques"])


@router.post("/")
def create_historique(payload: HistoriqueRechercheCreate,
                      db: Session = Depends(get_db),
                      current_user: Utilisateur = Depends(require_user)) -> HistoriqueRechercheRead:
    historique = historique_service.create(
        db=db,
        id_utilisateur=current_user.id,
        requete=payload.requete,
        nb_resultats=payload.nb_resultats,
    )
    return historique


@router.get("/")
def list_historiques(db: Session = Depends(get_db),
                     current_user: Utilisateur = Depends(require_user)) -> list[HistoriqueRechercheRead]:
    return historique_service.list_historique(db=db, id_utilisateur=current_user.id)


@router.delete("/{id_historique}")
def delete_historique(id_historique: int,
                      db: Session = Depends(get_db),
                      current_user: Utilisateur = Depends(require_user)):
    if not historique_service.delete_one(
        db=db,
        id_historique=id_historique,
        id_utilisateur=current_user.id,
    ):
        raise HTTPException(status_code=404, detail="Historique introuvable")
    return {"message": "entree supprimee"}


@router.delete("/")
def vider_historique(db: Session = Depends(get_db),
                     current_user: Utilisateur = Depends(require_user)):
    count = historique_service.delete_all(db=db, id_utilisateur=current_user.id)
    return {"message": f"{count} entree(s) supprimee(s)"}
