import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.dependencies import require_admin, require_admin_stream
from app.models.utilisateurs import Utilisateur
from app.schemas.log import LogListResponse
from app.schemas.utilisateur import UtilisateurAdminRow, UtilisateurAdminDetail
from app.schemas.admin import TokensStats, StockageStats, SanteStats, OverviewKpis
from app.services import log_service, utilisateur_service, consommation_service, document_service, overview_service
from app.services.log_broadcaster import broadcaster


def _client_ip(request: Request) -> str | None:
    return request.client.host if request.client else None


router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/logs", response_model=LogListResponse)
def list_logs(
    page: int = 1,
    size: int = 50,
    niveau: str | None = None,
    action: str | None = None,
    id_utilisateur: int | None = None,
    id_document: int | None = None,
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
        id_document=id_document,
        date_debut=date_debut,
        date_fin=date_fin,
    )


@router.get("/logs/stream")
async def stream_logs(_admin: Utilisateur = Depends(require_admin_stream)):
    async def event_generator():
        q = broadcaster.s_abonner()
        try:
            while True:
                log = await q.get()
                yield f"data: {json.dumps(log)}\n\n"
        finally:
            broadcaster.se_desabonner(q)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.get("/users", response_model=list[UtilisateurAdminRow])
def list_users(
    _admin: Utilisateur = Depends(require_admin),
    db: Session = Depends(get_db),
) -> list[UtilisateurAdminRow]:
    return utilisateur_service.list_users_admin(db)


@router.get("/users/{id_utilisateur}", response_model=UtilisateurAdminDetail)
def get_user(
    id_utilisateur: int,
    _admin: Utilisateur = Depends(require_admin),
    db: Session = Depends(get_db),
) -> UtilisateurAdminDetail:
    utilisateur = utilisateur_service.get_user_admin(db, id_utilisateur)
    if utilisateur is None:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    return utilisateur


@router.delete("/users/{id_utilisateur}")
def delete_user(
    id_utilisateur: int,
    request: Request,
    _admin: Utilisateur = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if id_utilisateur == _admin.id:
        raise HTTPException(status_code=403, detail="Un admin ne peut pas se supprimer lui-meme")

    utilisateur = db.query(Utilisateur).filter(Utilisateur.id == id_utilisateur).first()
    if utilisateur is None:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    nom_supprime = utilisateur.nom
    email_supprime = utilisateur.email

    utilisateur_service.delete_user_admin(db, id_utilisateur)

    log_service.log_action(
        db=db,
        niveau="warn",
        action="admin.user.delete",
        message=f"Utilisateur '{nom_supprime}' ({email_supprime}) supprime",
        contexte={"id_utilisateur": id_utilisateur, "nom": nom_supprime, "email": email_supprime},
        id_utilisateur=_admin.id,
        adresse_ip=_client_ip(request),
    )
    return {"message": "utilisateur supprime avec succes"}


@router.get("/tokens", response_model=TokensStats)
def get_tokens(
    jours: int | None = None,
    id_utilisateur: int | None = None,
    _admin: Utilisateur = Depends(require_admin),
    db: Session = Depends(get_db),
) -> TokensStats:
    return consommation_service.get_tokens_stats(db, jours=jours, id_utilisateur=id_utilisateur)


@router.get("/stockage", response_model=StockageStats)
def get_stockage(
    jours: int | None = None,
    _admin: Utilisateur = Depends(require_admin),
    db: Session = Depends(get_db),
) -> StockageStats:
    return document_service.get_stockage_stats(db, jours=jours)


@router.get("/sante", response_model=SanteStats)
def get_sante(
    jours: int | None = None,
    _admin: Utilisateur = Depends(require_admin),
    db: Session = Depends(get_db),
) -> SanteStats:
    return consommation_service.get_sante_stats(db, jours=jours)


@router.get("/overview", response_model=OverviewKpis)
def get_overview(
    jours: int = 7,
    _admin: Utilisateur = Depends(require_admin),
    db: Session = Depends(get_db),
) -> OverviewKpis:
    return overview_service.get_overview(db, jours=jours)
