import os
import uuid
from pathlib import Path

from sqlalchemy.orm import Session

from app.models.document import Document
from app.schemas.document import DocumentCreate
from app.services.extraction import extract_text

STORAGE_DIR = Path("/app/storage/documents")


def _save_binary(filename: str, file_bytes: bytes) -> tuple[str, str]:
    STORAGE_DIR.mkdir(parents=True, exist_ok=True)
    extension = os.path.splitext(filename)[1].lower()
    unique_name = f"{uuid.uuid4()}{extension}"
    chemin = STORAGE_DIR / unique_name
    chemin.write_bytes(file_bytes)
    return unique_name, extension.lstrip(".")


def create(
    db: Session,
    metadata: DocumentCreate,
    filename: str,
    file_bytes: bytes,
) -> Document:
    
    contenu = extract_text(filename, file_bytes)
    storage_fichier, type_fichier = _save_binary(filename, file_bytes)

    document = Document(
        titre=metadata.titre or filename,
        auteur=metadata.auteur,
        tags=metadata.tags,
        type_fichier=type_fichier,
        contenu=contenu,
        storage_fichier=storage_fichier,
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return document


def get_file_path(document: Document) -> Path:
    return STORAGE_DIR / document.storage_fichier
