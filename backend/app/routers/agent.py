from fastapi import APIRouter, Depends, HTTPException
from app.schemas.suggestion import SuggestionRead, SuggestionRefus
from app.services import agent_service
from app.database import get_db
from sqlalchemy.orm import Session
from app.core.dependencies import require_user
from app.models.utilisateurs import Utilisateur 

router = APIRouter(prefix="/agent", tags=["agent"])

@router.post("/analyser", response_model=list[SuggestionRead])
def lancer_analyse(db: Session = Depends(get_db), current_user: Utilisateur = Depends(require_user)):
    return agent_service.analyser_bibliotheque(db=db, id_utilisateur=current_user.id)

@router.get("/suggestions", response_model=list[SuggestionRead])
def lister_suggestions(db: Session = Depends(get_db), current_user: Utilisateur = Depends(require_user)):
    return agent_service.lister_suggestions_en_attente(db=db, id_utilisateur=current_user.id)

@router.post("/suggestions/{id_suggestion}/valider", response_model=SuggestionRead)
def valider_suggestion(id_suggestion: int, db: Session = Depends(get_db), current_user: Utilisateur = Depends(require_user)):
    suggestion = agent_service.get_suggestion(db=db, id_suggestion=id_suggestion, id_utilisateur=current_user.id)
    if not suggestion:
        raise HTTPException(status_code=404, detail="Suggestion non trouvée")
    if suggestion.statut != "en_attente":
        raise HTTPException(status_code=400, detail="Suggestion déjà traitée")
    return agent_service.valider_suggestion(db=db, suggestion=suggestion)

@router.post("/suggestions/{id_suggestion}/refuser", response_model=SuggestionRead)
def refuser_suggestion(id_suggestion: int, payload: SuggestionRefus, db: Session = Depends(get_db), current_user: Utilisateur = Depends(require_user)):
    suggestion = agent_service.get_suggestion(db=db, id_suggestion=id_suggestion, id_utilisateur=current_user.id)
    if not suggestion:
        raise HTTPException(status_code=404, detail="Suggestion non trouvée")
    if suggestion.statut != "en_attente":
        raise HTTPException(status_code=400, detail="Suggestion déjà traitée")
    return agent_service.refuser_suggestion(db=db, suggestion=suggestion, raison_refus=payload.raison_refus)
