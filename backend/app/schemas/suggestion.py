from pydantic import BaseModel, ConfigDict
from datetime import datetime


class SuggestionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
     
    id: int
    id_utilisateur: int
    type: str
    payload: dict
    statut: str
    raison_refus: str | None = None
    date_creation: datetime
    date_traitement: datetime | None = None

class SuggestionRefus(BaseModel):
    raison_refus: str | None = None
    