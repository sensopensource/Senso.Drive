from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.documents import Document
from app.models.versions import Version
from app.models.suggestions import Suggestion
from app.schemas.dashboard import DashboardUtilisateur


def get_dashboard_utilisateur(db: Session, id_utilisateur: int) -> DashboardUtilisateur:
    documents_total = (db.query(func.count(Document.id))
                       .filter(Document.id_utilisateur == id_utilisateur,
                               Document.deleted_at.is_(None))
                       .scalar())

    lignes_type = (db.query(Version.type_fichier, func.count(func.distinct(Document.id)))
                   .join(Document, Document.id == Version.id_document)
                   .filter(Document.id_utilisateur == id_utilisateur,
                           Document.deleted_at.is_(None))
                   .group_by(Version.type_fichier)
                   .all())

    docs_par_type = {}
    for type_fichier, nb in lignes_type:
        docs_par_type[type_fichier] = nb

    suggestions_en_attente = (db.query(func.count(Suggestion.id))
                              .filter(Suggestion.id_utilisateur == id_utilisateur,
                                      Suggestion.statut == "en_attente")
                              .scalar())

    return DashboardUtilisateur(
        documents_total=documents_total,
        docs_par_type=docs_par_type,
        suggestions_en_attente=suggestions_en_attente,
    )
