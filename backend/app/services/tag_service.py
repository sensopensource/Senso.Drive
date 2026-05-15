import hashlib

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models.tags import Tag
from app.models.documents import Document
from app.schemas.tag import TagRead


def _generate_tag_color(name: str) -> str:
    digest = hashlib.md5(name.lower().encode()).hexdigest()
    hue = int(digest[:6], 16) % 360
    return f"hsl({hue}, 60%, 35%)"


def create_tag(db: Session, name: str, id_utilisateur: int) -> TagRead:
    name_clean = name.strip()

    existing = db.query(Tag).filter(
        Tag.name == name_clean,
        Tag.id_utilisateur == id_utilisateur,
    ).first()
    if existing:
        return TagRead.model_validate(existing)

    tag = Tag(
        name=name_clean,
        color=_generate_tag_color(name_clean),
        id_utilisateur=id_utilisateur,
    )
    db.add(tag)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        existing = db.query(Tag).filter(
            Tag.name == name_clean,
            Tag.id_utilisateur == id_utilisateur,
        ).first()
        return TagRead.model_validate(existing)

    db.refresh(tag)
    return TagRead.model_validate(tag)


def list_tags(db: Session, id_utilisateur: int) -> list[TagRead]:
    tags = db.query(Tag).filter(Tag.id_utilisateur == id_utilisateur).order_by(Tag.name).all()
    return [TagRead.model_validate(tag) for tag in tags]


def delete_tag(db: Session, id_tag: int, id_utilisateur: int) -> bool:
    tag = db.query(Tag).filter(
        Tag.id == id_tag,
        Tag.id_utilisateur == id_utilisateur,
    ).first()
    if not tag:
        return False
    db.delete(tag)
    db.commit()
    return True


def assign_tags_to_document(
    db: Session,
    id_document: int,
    tag_ids: list[int],
    id_utilisateur: int,
) -> None:
    document = db.query(Document).filter(Document.id == id_document,
                                         Document.id_utilisateur == id_utilisateur).first()
    if not document:
        return

    tags = db.query(Tag).filter(
        Tag.id.in_(tag_ids),
        Tag.id_utilisateur == id_utilisateur,
    ).all()

    document.tags = tags
    db.commit()


def remove_tag_from_document(
    db: Session,
    id_document: int,
    id_tag: int,
    id_utilisateur: int,
) -> None:
    document = db.query(Document).filter(
        Document.id == id_document,
        Document.id_utilisateur == id_utilisateur,
    ).first()
    if not document:
        return

    tag = db.query(Tag).filter(
        Tag.id == id_tag,
        Tag.id_utilisateur == id_utilisateur,
    ).first()
    if tag and tag in document.tags:
        document.tags.remove(tag)
        db.commit()
