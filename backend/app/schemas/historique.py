from datetime import datetime
from pydantic import BaseModel

class HistoriqueRechercheCreate(BaseModel):
    requete: str
    nb_resultats: int

class HistoriqueRechercheRead(BaseModel):
    id: int
    requete: str
    nb_resultats: int
    date_recherche: datetime

    class Config:
        from_attributes = True
