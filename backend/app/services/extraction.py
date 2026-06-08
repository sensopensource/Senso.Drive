from pypdf import PdfReader
from docx import Document as DocxDocument
from io import BytesIO
import os
from fastapi import HTTPException

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}
IMAGE_TYPES = {"jpg", "jpeg", "png"}


#fonction qui extrait le text dun pdf
def extract_pdf(file_bytes: bytes) -> str:
    reader = PdfReader(BytesIO(file_bytes))
    text= ""
    for page in reader.pages:
        text+=page.extract_text() + "\n"
    return text

#fonction qui extrait le text dun word
def extract_docx(file_bytes: bytes) -> str:
    doc = DocxDocument(BytesIO(file_bytes))
    text = ""
    for paragraph in doc.paragraphs:
        text += paragraph.text +"\n"
    return text


def is_image(filename: str) -> bool:
    return os.path.splitext(filename)[1].lower() in IMAGE_EXTENSIONS


def is_image_type(type_fichier: str) -> bool:
    return type_fichier.lower() in IMAGE_TYPES


def process_upload(filename: str, file_bytes: bytes) -> tuple[str, str]:
    extension = os.path.splitext(filename)[1].lower()
    if extension == ".pdf":
        return extract_pdf(file_bytes), "a_resumer"
    elif extension == ".docx":
        return extract_docx(file_bytes), "a_resumer"
    elif extension in (".txt", ".md"):
        return file_bytes.decode("utf-8", errors="replace"), "a_resumer"
    elif extension in IMAGE_EXTENSIONS:
        return "", "a_analyser"
    else:
        raise HTTPException(status_code=415, detail=f"Format du fichier {filename} n'est pas supporte")
