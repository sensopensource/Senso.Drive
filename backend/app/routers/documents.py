from fastapi import APIRouter, UploadFile, File, HTTPException, Depends,Form
from sqlalchemy.orm import Session 
from app.schemas.document import DocumentRead,DocumentCreate
from app.database import get_db
from app.models.document import Document
from app.services.extraction import extract_text
from app.services import document_service

router = APIRouter(prefix="/documents",tags=["documents"])

@router.post("/", response_model=DocumentRead)
async def upload_document(
    file: UploadFile = File(...),
    titre: str | None = Form(None),
    auteur: str | None = Form(None),
    tags: list[str] | None = Form(None),
    db: Session = Depends(get_db),
):
    file_bytes = await file.read()
    metadata = DocumentCreate(titre=titre,auteur=auteur,tags=tags)
    document = document_service.create(db=db,metadata=metadata,filename=file.filename,file_bytes=file_bytes)
    
    return document
    
