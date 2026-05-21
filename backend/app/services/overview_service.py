from datetime import datetime, timedelta, timezone
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.utilisateurs import Utilisateur
from app.models.documents import Document
from app.models.versions import Version
from app.models.suggestions import Suggestion
from app.models.consommations_tokens import ConsommationTokens
from app.models.logs import Log
from app.schemas.admin import OverviewKpis, OverviewDocType


def _somme_tokens(db: Session, debut: datetime, fin: datetime) -> int:
    total = (db.query(func.sum(ConsommationTokens.tokens_in + ConsommationTokens.tokens_out))
               .filter(ConsommationTokens.cree_le >= debut,
                       ConsommationTokens.cree_le <  fin)
               .scalar())
    if total is None:
        return 0
    return int(total)


def get_overview(db: Session, jours: int = 7) -> OverviewKpis:
    maintenant      = datetime.now(timezone.utc)
    seuil           = maintenant - timedelta(days=jours)
    seuil_precedent = maintenant - timedelta(days=2 * jours)
    debut_jour      = maintenant.replace(hour=0, minute=0, second=0, microsecond=0)

    utilisateurs_total = db.query(func.count(Utilisateur.id)).scalar()
    utilisateurs_delta = (db.query(func.count(Utilisateur.id))
                            .filter(Utilisateur.date_inscription >= seuil)
                            .scalar())

    documents_total = (db.query(func.count(Document.id))
                         .filter(Document.deleted_at.is_(None))
                         .scalar())
    documents_delta = (db.query(func.count(Document.id))
                         .filter(Document.deleted_at.is_(None),
                                 Document.date_creation >= seuil)
                         .scalar())

    tokens_periode   = _somme_tokens(db, seuil, maintenant)
    tokens_precedent = _somme_tokens(db, seuil_precedent, seuil)
    if tokens_precedent > 0:
        tokens_delta_pct = (tokens_periode - tokens_precedent) / tokens_precedent * 100
    else:
        tokens_delta_pct = None

    lignes_statut = (db.query(Suggestion.statut, func.count(Suggestion.id))
                       .filter(Suggestion.date_creation >= seuil)
                       .group_by(Suggestion.statut)
                       .all())
    par_statut = dict(lignes_statut)
    suggestions_validees   = par_statut.get("validee", 0)
    suggestions_refusees   = par_statut.get("refusee", 0)
    suggestions_en_attente = par_statut.get("en_attente", 0)
    suggestions_total      = suggestions_validees + suggestions_refusees + suggestions_en_attente

    evenements_total = (db.query(func.count(Log.id))
                          .filter(Log.cree_le >= seuil)
                          .scalar())
    evenements_erreurs_jour = (db.query(func.count(Log.id))
                                 .filter(Log.niveau == "err",
                                         Log.cree_le >= debut_jour)
                                 .scalar())

    lignes_type = (db.query(Version.type_fichier, func.count(func.distinct(Document.id)))
                     .join(Document, Document.id == Version.id_document)
                     .filter(Document.deleted_at.is_(None))
                     .group_by(Version.type_fichier)
                     .all())
    docs_par_type = []
    for type_fichier, nb in lignes_type:
        docs_par_type.append(OverviewDocType(type_fichier=type_fichier, nb_documents=nb))

    return OverviewKpis(
        utilisateurs_total=utilisateurs_total,
        utilisateurs_delta=utilisateurs_delta,
        documents_total=documents_total,
        documents_delta=documents_delta,
        tokens_periode=tokens_periode,
        tokens_delta_pct=tokens_delta_pct,
        suggestions_total=suggestions_total,
        suggestions_validees=suggestions_validees,
        suggestions_refusees=suggestions_refusees,
        suggestions_en_attente=suggestions_en_attente,
        evenements_total=evenements_total,
        evenements_erreurs_jour=evenements_erreurs_jour,
        docs_par_type=docs_par_type,
    )
