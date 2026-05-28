from datetime import datetime
from pydantic import BaseModel, ConfigDict


class LogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    id_utilisateur: int | None = None
    nom_utilisateur: str | None = None
    niveau: str
    action: str
    message: str
    contexte: dict | None = None
    adresse_ip: str | None = None
    cree_le: datetime


class LogListResponse(BaseModel):
    items: list[LogRead]
    total: int
    page: int
    size: int
