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


class TokensParUtilisateur(BaseModel):
    id_utilisateur: int
    nom: str
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
    par_utilisateur: list[TokensParUtilisateur]
    serie_temporelle: list[TokensPoint]


class StockageParType(BaseModel):
    type_fichier: str
    taille_octets: int


class StockageConsommateur(BaseModel):
    id_utilisateur: int
    nom: str
    taille_octets: int
    nb_documents: int


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
    latence_p50_ms: float 
  
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
    latence_p95_ms: float
    par_source: list[SanteParSource]
    derniers_incidents: list[SanteIncident]


class OverviewDocType(BaseModel):
    type_fichier: str
    nb_documents: int


class OverviewKpis(BaseModel):
    utilisateurs_total: int
    utilisateurs_delta: int
    documents_total: int
    documents_delta: int
    tokens_periode: int
    tokens_delta_pct: float | None
    suggestions_total: int
    suggestions_validees: int
    suggestions_refusees: int
    suggestions_en_attente: int
    evenements_total: int
    evenements_erreurs_jour: int
    docs_par_type: list[OverviewDocType]
