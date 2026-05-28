from datetime import datetime, timedelta, timezone
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.utilisateurs import Utilisateur
from app.models.documents import Document
from app.models.suggestions import Suggestion
from app.models.consommations_tokens import ConsommationTokens
from app.models.logs import Log
from app.models.versions import Version
from app.models.tags import Tag
from app.models.categories import Categorie
from app.models.historiques_recherches import HistoriqueRecherche
from app.models.preferences_utilisateur_dashboard import PreferenceUtilisateurDashboard
from app.schemas.utilisateur import UtilisateurAdminRow, UtilisateurAdminDetail,StockageUtilisateur
from app.core.config import STOCKAGE_QUOTA_OCTETS


def list_users_admin(db: Session) -> list[UtilisateurAdminRow]:
    utilisateurs = db.query(Utilisateur).order_by(Utilisateur.date_inscription.asc()).all()

    docs_par_user = dict(db.query(Document.id_utilisateur, func.count(Document.id))
                         .filter(Document.deleted_at.is_(None))
                         .group_by(Document.id_utilisateur)
                         .all())

    seuil_30j = datetime.now(timezone.utc) - timedelta(days=30)
    tokens_par_user = dict(db.query(ConsommationTokens.id_utilisateur,
                                    func.sum(ConsommationTokens.tokens_in + ConsommationTokens.tokens_out))
                           .filter(ConsommationTokens.cree_le >= seuil_30j)
                           .group_by(ConsommationTokens.id_utilisateur)
                           .all())

    suggestions_par_user = dict(db.query(Suggestion.id_utilisateur, func.count(Suggestion.id))
                                .group_by(Suggestion.id_utilisateur)
                                .all())

    dernier_login_par_user = dict(db.query(Log.id_utilisateur, func.max(Log.cree_le))
                                  .filter(Log.action == "auth.login.success")
                                  .group_by(Log.id_utilisateur)
                                  .all())

    lignes = []
    for utilisateur in utilisateurs:
        userrow = UtilisateurAdminRow(
            id=utilisateur.id,
            nom=utilisateur.nom,
            email=utilisateur.email,
            role=utilisateur.role,
            date_inscription=utilisateur.date_inscription,
            nb_documents=docs_par_user.get(utilisateur.id, 0),
            tokens_30j=tokens_par_user.get(utilisateur.id, 0),
            nb_suggestions=suggestions_par_user.get(utilisateur.id, 0),
            dernier_login=dernier_login_par_user.get(utilisateur.id),
        )
        lignes.append(userrow)

    return lignes


def get_user_admin(db: Session, id_utilisateur: int) -> UtilisateurAdminDetail | None:
    utilisateur = db.query(Utilisateur).filter(Utilisateur.id == id_utilisateur).first()
    if utilisateur is None:
        return None

    nb_documents = (db.query(func.count(Document.id))
                    .filter(Document.id_utilisateur == id_utilisateur,
                            Document.deleted_at.is_(None))
                    .scalar())

    seuil_30j = datetime.now(timezone.utc) - timedelta(days=30)
    tokens_30j = (db.query(func.sum(ConsommationTokens.tokens_in + ConsommationTokens.tokens_out))
                  .filter(ConsommationTokens.id_utilisateur == id_utilisateur,
                          ConsommationTokens.cree_le >= seuil_30j)
                  .scalar())
    if tokens_30j is None:
        tokens_30j = 0

    nb_suggestions = (db.query(func.count(Suggestion.id))
                      .filter(Suggestion.id_utilisateur == id_utilisateur)
                      .scalar())

    stockage_octets = (db.query(func.sum(Version.taille_octets))
                       .join(Document, Version.id_document == Document.id)
                       .filter(Document.id_utilisateur == id_utilisateur)
                       .scalar())
    if stockage_octets is None:
        stockage_octets = 0

    dernier_login = (db.query(func.max(Log.cree_le))
                     .filter(Log.id_utilisateur == id_utilisateur,
                             Log.action == "auth.login.success")
                     .scalar())

    return UtilisateurAdminDetail(
        id=utilisateur.id,
        nom=utilisateur.nom,
        email=utilisateur.email,
        role=utilisateur.role,
        date_inscription=utilisateur.date_inscription,
        nb_documents=nb_documents,
        tokens_30j=tokens_30j,
        nb_suggestions=nb_suggestions,
        dernier_login=dernier_login,
        stockage_octets=stockage_octets,
    )

def get_user_stockage(db: Session,id_utilisateur: int) -> StockageUtilisateur:
    utilise = ( db.query(func.sum(Version.taille_octets))
                  .join(Document, Version.id_document == Document.id)
                  .filter(Document.id_utilisateur == id_utilisateur)
                  .scalar()
               )
    if utilise is None:
        utilise = 0
    return StockageUtilisateur(utilise_octets=int(utilise),quota_octets=STOCKAGE_QUOTA_OCTETS)


def delete_user_admin(db: Session, id_utilisateur: int) -> bool:
    utilisateur = db.query(Utilisateur).filter(Utilisateur.id == id_utilisateur).first()
    if utilisateur is None:
        return False

    documents = db.query(Document).filter(Document.id_utilisateur == id_utilisateur).all()
    for document in documents:
        db.delete(document)

    tags = db.query(Tag).filter(Tag.id_utilisateur == id_utilisateur).all()
    for tag in tags:
        db.delete(tag)

    categories_racines = (db.query(Categorie)
                          .filter(Categorie.id_utilisateur == id_utilisateur,
                                  Categorie.id_parent.is_(None))
                          .all())
    for categorie in categories_racines:
        db.delete(categorie)

    (db.query(Suggestion)
     .filter(Suggestion.id_utilisateur == id_utilisateur)
     .delete())

    (db.query(ConsommationTokens)
     .filter(ConsommationTokens.id_utilisateur == id_utilisateur)
     .delete())

    (db.query(HistoriqueRecherche)
     .filter(HistoriqueRecherche.id_utilisateur == id_utilisateur)
     .delete())

    (db.query(PreferenceUtilisateurDashboard)
     .filter(PreferenceUtilisateurDashboard.id_utilisateur == id_utilisateur)
     .delete())

    (db.query(Log)
     .filter(Log.id_utilisateur == id_utilisateur)
     .update({Log.id_utilisateur: None}))

    db.delete(utilisateur)
    db.commit()
    return True
