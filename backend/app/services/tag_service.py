from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.tags import Tag
from app.models.documents import Document
from app.schemas.tag import TagCreate, TagRead


def _generate_tag_color(name: str) -> str:
    hash_val = abs(hash(name.lower()))
    hue = hash_val % 360
    return f"hsl({hue}, 70%, 50%)"


def create_tag(db: Session, name: str, id_utilisateur: int) -> TagRead:
    tag = Tag(
        name=name,
        color=_generate_tag_color(name),
        id_utilisateur=id_utilisateur
    )
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return TagRead.model_validate(tag)


def list_tags(db: Session, id_utilisateur: int) -> list[TagRead]:
    tags = db.query(Tag).filter(Tag.id_utilisateur == id_utilisateur).all()
    return [TagRead.model_validate(tag) for tag in tags]


def delete_tag(db: Session, id_tag: int, id_utilisateur: int) -> None:
    tag = db.query(Tag).filter(
        Tag.id == id_tag,
        Tag.id_utilisateur == id_utilisateur
    ).first()
    if tag:
        db.delete(tag)
        db.commit()


def assign_tags_to_document(
    db: Session,
    id_document: int,
    tag_ids: list[int],
    id_utilisateur: int
) -> None:
    document = db.query(Document).filter(Document.id == id_document).first()
    if not document:
        return

    tags = db.query(Tag).filter(
        Tag.id.in_(tag_ids),
        Tag.id_utilisateur == id_utilisateur
    ).all()

    document.tags = tags
    db.commit()


def remove_tag_from_document(
    db: Session,
    id_document: int,
    id_tag: int,
    id_utilisateur: int
) -> None:
    tag = db.query(Tag).filter(
        Tag.id == id_tag,
        Tag.id_utilisateur == id_utilisateur
    ).first()

    if tag:
        document = db.query(Document).filter(Document.id == id_document).first()
        if document and tag in document.tags:
            document.tags.remove(tag)
            db.commit()
