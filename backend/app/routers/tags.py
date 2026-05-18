from fastapi import APIRouter, Depends, HTTPException, Request
from app.models.utilisateurs import Utilisateur
from app.core.dependencies import require_user
from app.schemas.tag import TagCreate, TagRead
from app.services import tag_service, log_service
from sqlalchemy.orm import Session
from app.database import get_db


def _client_ip(request: Request) -> str | None:
    return request.client.host if request.client else None


router = APIRouter(prefix="/tags", tags=["tags"])


@router.get("/")
def list_tags(
    current_user: Utilisateur = Depends(require_user),
    db: Session = Depends(get_db)
) -> list[TagRead]:
    return tag_service.list_tags(db=db, id_utilisateur=current_user.id)


@router.post("/")
def create_tag(
    tag_create: TagCreate,
    request: Request,
    current_user: Utilisateur = Depends(require_user),
    db: Session = Depends(get_db)
) -> TagRead:
    tag = tag_service.create_tag(db=db, name=tag_create.name, id_utilisateur=current_user.id)
    log_service.log_action(
        db=db,
        niveau="info",
        action="tag.create",
        message=f"Tag '{tag.name}' cree",
        contexte={"id_tag": tag.id, "name": tag.name},
        id_utilisateur=current_user.id,
        adresse_ip=_client_ip(request),
    )
    return tag


@router.delete("/{id_tag}")
def delete_tag(
    id_tag: int,
    current_user: Utilisateur = Depends(require_user),
    db: Session = Depends(get_db)
):
    if not tag_service.delete_tag(db=db, id_tag=id_tag, id_utilisateur=current_user.id):
        raise HTTPException(status_code=404, detail="Tag non trouve")
    return {"message": "tag supprime avec succes"}
