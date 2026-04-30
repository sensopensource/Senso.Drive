from fastapi import APIRouter, Depends, HTTPException
from app.models.utilisateurs import Utilisateur
from app.core.dependencies import get_current_user
from app.schemas.tag import TagCreate, TagRead
from app.services import tag_service
from sqlalchemy.orm import Session
from app.database import get_db

router = APIRouter(prefix="/tags", tags=["tags"])


@router.get("")
def list_tags(
    current_user: Utilisateur = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> list[TagRead]:
    return tag_service.list_tags(db=db, id_utilisateur=current_user.id)


@router.post("")
def create_tag(
    tag_create: TagCreate,
    current_user: Utilisateur = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> TagRead:
    return tag_service.create_tag(db=db, name=tag_create.name, id_utilisateur=current_user.id)


@router.delete("/{id_tag}")
def delete_tag(
    id_tag: int,
    current_user: Utilisateur = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tag_service.delete_tag(db=db, id_tag=id_tag, id_utilisateur=current_user.id)
    return {"message": "tag supprime avec succes"}
