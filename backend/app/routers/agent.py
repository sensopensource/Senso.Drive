from fastapi import APIRouter, Depends, HTTPException, Request
from app.schemas.suggestion import SuggestionRead, SuggestionRefus
from app.services import agent_service, log_service
from app.database import get_db
from sqlalchemy.orm import Session
from app.core.dependencies import require_user
from app.models.utilisateurs import Utilisateur


def _client_ip(request: Request) -> str | None:
    return request.client.host if request.client else None


router = APIRouter(prefix="/agent", tags=["agent"])


@router.post("/analyser", response_model=list[SuggestionRead])
def lancer_analyse(request: Request,
                   db: Session = Depends(get_db),
                   current_user: Utilisateur = Depends(require_user)):
    log_service.log_action(
        db=db,
        niveau="info",
        action="agent.analyse.lancee",
        message="Analyse de la bibliotheque lancee",
        id_utilisateur=current_user.id,
        adresse_ip=_client_ip(request),
    )

    try:
        suggestions = agent_service.analyser_bibliotheque(db=db, id_utilisateur=current_user.id)
    except Exception as e:
        log_service.log_action(
            db=db,
            niveau="err",
            action="llm.error",
            message=f"Echec de l'analyse agent : {e}",
            contexte={"source": "agent", "erreur": str(e)},
            id_utilisateur=current_user.id,
            adresse_ip=_client_ip(request),
        )
        raise HTTPException(status_code=502, detail="L'agent IA est indisponible")

    log_service.log_action(
        db=db,
        niveau="ok",
        action="agent.analyse.terminee",
        message=f"Analyse terminee : {len(suggestions)} suggestion(s) generee(s)",
        contexte={"nb_suggestions": len(suggestions)},
        id_utilisateur=current_user.id,
        adresse_ip=_client_ip(request),
    )
    return suggestions


@router.get("/suggestions", response_model=list[SuggestionRead])
def lister_suggestions(db: Session = Depends(get_db),
                       current_user: Utilisateur = Depends(require_user)):
    return agent_service.lister_suggestions_en_attente(db=db, id_utilisateur=current_user.id)


@router.post("/suggestions/{id_suggestion}/valider", response_model=SuggestionRead)
def valider_suggestion(id_suggestion: int,
                       request: Request,
                       db: Session = Depends(get_db),
                       current_user: Utilisateur = Depends(require_user)):
    suggestion = agent_service.get_suggestion(db=db, id_suggestion=id_suggestion, id_utilisateur=current_user.id)
    if not suggestion:
        raise HTTPException(status_code=404, detail="Suggestion non trouvée")
    if suggestion.statut != "en_attente":
        raise HTTPException(status_code=400, detail="Suggestion déjà traitée")

    resultat = agent_service.valider_suggestion(db=db, suggestion=suggestion, adresse_ip=_client_ip(request))

    log_service.log_action(
        db=db,
        niveau="ok",
        action="agent.suggestion.validee",
        message=f"Suggestion #{id_suggestion} validee ({suggestion.type})",
        contexte={"id_suggestion": id_suggestion, "type": suggestion.type},
        id_utilisateur=current_user.id,
        adresse_ip=_client_ip(request),
    )
    return resultat


@router.post("/suggestions/{id_suggestion}/refuser", response_model=SuggestionRead)
def refuser_suggestion(id_suggestion: int,
                       payload: SuggestionRefus,
                       request: Request,
                       db: Session = Depends(get_db),
                       current_user: Utilisateur = Depends(require_user)):
    suggestion = agent_service.get_suggestion(db=db, id_suggestion=id_suggestion, id_utilisateur=current_user.id)
    if not suggestion:
        raise HTTPException(status_code=404, detail="Suggestion non trouvée")
    if suggestion.statut != "en_attente":
        raise HTTPException(status_code=400, detail="Suggestion déjà traitée")

    resultat = agent_service.refuser_suggestion(db=db, suggestion=suggestion, raison_refus=payload.raison_refus)

    log_service.log_action(
        db=db,
        niveau="info",
        action="agent.suggestion.refusee",
        message=f"Suggestion #{id_suggestion} refusee ({suggestion.type})",
        contexte={"id_suggestion": id_suggestion,
                  "type": suggestion.type,
                  "raison_refus": payload.raison_refus},
        id_utilisateur=current_user.id,
        adresse_ip=_client_ip(request),
    )
    return resultat
