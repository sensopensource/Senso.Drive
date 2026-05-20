from datetime import date, datetime
from pydantic import BaseModel


class TokensParSource(BaseModel):
    source: str
    tokens_in: int
    tokens_out: int
    cout_estime: float


class TokensParModele(BaseModel):
    modele: str
    tokens_in: int
    tokens_out: int
    cout_estime: float


class TokensPoint(BaseModel):
    jour: date
    tokens_in: int
    tokens_out: int


class TokensStats(BaseModel):
    total_tokens_in: int
    total_tokens_out: int
    cout_estime_total: float
    par_source: list[TokensParSource]
    par_modele: list[TokensParModele]
    serie_temporelle: list[TokensPoint]


class StockageParType(BaseModel):
    type_fichier: str
    taille_octets: int


class StockageConsommateur(BaseModel):
    id_utilisateur: int
    nom: str
    taille_octets: int


class StockagePoint(BaseModel):
    jour: date
    taille_octets: int
    taille_cumulee: int


class StockageStats(BaseModel):
    total_octets: int
    par_type: list[StockageParType]
    top_consommateurs: list[StockageConsommateur]
    serie_temporelle: list[StockagePoint]


class SanteParSource(BaseModel):
    source: str
    nb_appels: int
    nb_erreurs: int
    taux_erreur: float
    latence_moyenne_ms: float
    latence_p95_ms: float


class SanteIncident(BaseModel):
    source: str
    modele: str
    statut: str
    message_erreur: str | None = None
    latence_ms: int
    cree_le: datetime


class SanteStats(BaseModel):
    etat_global: str
    nb_appels: int
    nb_erreurs: int
    taux_erreur: float
    par_source: list[SanteParSource]
    derniers_incidents: list[SanteIncident]
