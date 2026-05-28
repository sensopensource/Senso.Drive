from datetime import datetime, timedelta, timezone
from sqlalchemy import func, cast, Date
from sqlalchemy.orm import Session
from app.models.consommations_tokens import ConsommationTokens
from app.models.utilisateurs import Utilisateur
from app.core.tarifs_llm import cout_estime
from app.schemas.admin import TokensStats, TokensParSource, TokensParModele, TokensParUtilisateur, TokensPoint
from app.schemas.admin import SanteStats, SanteParSource, SanteIncident


def enregistrer(db: Session,
                id_utilisateur: int,
                source: str,
                modele: str,
                tokens_in: int,
                tokens_out: int,
                latence_ms: int,
                statut: str,
                message_erreur: str | None = None) -> None:

    consommation = ConsommationTokens(
          id_utilisateur=id_utilisateur,
          source=source,
          modele=modele,
          tokens_in=tokens_in,
          tokens_out=tokens_out,
          latence_ms=latence_ms,
          statut=statut,
          message_erreur=message_erreur,
      )
    db.add(consommation)
    db.commit()


def get_tokens_stats(db: Session,
                     jours: int | None = None,
                     id_utilisateur: int | None = None) -> TokensStats:
    conditions = []
    if jours is not None:
        seuil = datetime.now(timezone.utc) - timedelta(days=jours)
        conditions.append(ConsommationTokens.cree_le >= seuil)
    if id_utilisateur is not None:
        conditions.append(ConsommationTokens.id_utilisateur == id_utilisateur)

    lignes_groupes = (db.query(ConsommationTokens.id_utilisateur,
                               Utilisateur.nom,
                               ConsommationTokens.source,
                               ConsommationTokens.modele,
                               func.sum(ConsommationTokens.tokens_in),
                               func.sum(ConsommationTokens.tokens_out))
                      .join(Utilisateur, Utilisateur.id == ConsommationTokens.id_utilisateur)
                      .filter(*conditions)
                      .group_by(ConsommationTokens.id_utilisateur,
                                Utilisateur.nom,
                                ConsommationTokens.source,
                                ConsommationTokens.modele)
                      .all())

    par_source = {}
    par_modele = {}
    par_utilisateur = {}
    total_in = 0
    total_out = 0
    total_cout = 0.0

    for id_user, nom, source, modele, sum_in, sum_out in lignes_groupes:
        cout = cout_estime(modele, sum_in, sum_out)

        if source not in par_source:
            par_source[source] = {"tokens_in": 0, "tokens_out": 0, "cout_estime": 0.0}
        par_source[source]["tokens_in"] += sum_in
        par_source[source]["tokens_out"] += sum_out
        par_source[source]["cout_estime"] += cout

        if modele not in par_modele:
            par_modele[modele] = {"tokens_in": 0, "tokens_out": 0, "cout_estime": 0.0}
        par_modele[modele]["tokens_in"] += sum_in
        par_modele[modele]["tokens_out"] += sum_out
        par_modele[modele]["cout_estime"] += cout

        if id_user not in par_utilisateur:
            par_utilisateur[id_user] = {"nom": nom, "tokens_in": 0, "tokens_out": 0, "cout_estime": 0.0}
        par_utilisateur[id_user]["tokens_in"] += sum_in
        par_utilisateur[id_user]["tokens_out"] += sum_out
        par_utilisateur[id_user]["cout_estime"] += cout

        total_in += sum_in
        total_out += sum_out
        total_cout += cout

    sources = []
    for source, valeurs in par_source.items():
        sources.append(TokensParSource(source=source,
                                        tokens_in=valeurs["tokens_in"],
                                        tokens_out=valeurs["tokens_out"],
                                        cout_estime=valeurs["cout_estime"]))

    modeles = []
    for modele, valeurs in par_modele.items():
        modeles.append(TokensParModele(modele=modele,
                                       tokens_in=valeurs["tokens_in"],
                                       tokens_out=valeurs["tokens_out"],
                                       cout_estime=valeurs["cout_estime"]))

    utilisateurs = []
    for id_user, valeurs in par_utilisateur.items():
        utilisateurs.append(TokensParUtilisateur(id_utilisateur=id_user,
                                                  nom=valeurs["nom"],
                                                  tokens_in=valeurs["tokens_in"],
                                                  tokens_out=valeurs["tokens_out"],
                                                  cout_estime=valeurs["cout_estime"]))
    utilisateurs.sort(key=lambda u: u.cout_estime, reverse=True)

    lignes_jours = (db.query(cast(ConsommationTokens.cree_le, Date),
                             func.sum(ConsommationTokens.tokens_in),
                             func.sum(ConsommationTokens.tokens_out))
                    .filter(*conditions)
                    .group_by(cast(ConsommationTokens.cree_le, Date))
                    .order_by(cast(ConsommationTokens.cree_le, Date))
                    .all())

    serie = []
    for jour, sum_in, sum_out in lignes_jours:
        serie.append(TokensPoint(jour=jour, tokens_in=sum_in, tokens_out=sum_out))

    return TokensStats(
        total_tokens_in=total_in,
        total_tokens_out=total_out,
        cout_estime_total=total_cout,
        par_source=sources,
        par_modele=modeles,
        par_utilisateur=utilisateurs,
        serie_temporelle=serie,
    )


def get_sante_stats(db: Session, jours: int | None = None) -> SanteStats:
    conditions = []
    if jours is not None:
        seuil = datetime.now(timezone.utc) - timedelta(days=jours)
        conditions.append(ConsommationTokens.cree_le >= seuil)

    lignes_source = (db.query(ConsommationTokens.source,
                              func.count(ConsommationTokens.id),
                              func.count(ConsommationTokens.id).filter(ConsommationTokens.statut != "ok"),
                              func.avg(ConsommationTokens.latence_ms),
                              func.percentile_cont(0.95).within_group(ConsommationTokens.latence_ms.asc()))
                     .filter(*conditions)
                     .group_by(ConsommationTokens.source)
                     .all())

    par_source = []
    total_appels = 0
    total_erreurs = 0

    for source, nb_appels, nb_erreurs, latence_moyenne, latence_p95 in lignes_source:
        if nb_appels > 0:
            taux_erreur = nb_erreurs / nb_appels
        else:
            taux_erreur = 0.0

        par_source.append(SanteParSource(source=source,
                                          nb_appels=nb_appels,
                                          nb_erreurs=nb_erreurs,
                                          taux_erreur=taux_erreur,
                                          latence_moyenne_ms=float(latence_moyenne),
                                          latence_p95_ms=float(latence_p95)))
        total_appels += nb_appels
        total_erreurs += nb_erreurs

    if total_appels > 0:
        taux_erreur_global = total_erreurs / total_appels
    else:
        taux_erreur_global = 0.0

    if taux_erreur_global < 0.05:
        etat_global = "vert"
    elif taux_erreur_global < 0.20:
        etat_global = "orange"
    else:
        etat_global = "rouge"

    incidents = (db.query(ConsommationTokens)
                 .filter(*conditions)
                 .filter(ConsommationTokens.statut != "ok")
                 .order_by(ConsommationTokens.cree_le.desc())
                 .limit(20)
                 .all())

    derniers_incidents = []
    for incident in incidents:
        derniers_incidents.append(SanteIncident(source=incident.source,
                                                 modele=incident.modele,
                                                 statut=incident.statut,
                                                 message_erreur=incident.message_erreur,
                                                 latence_ms=incident.latence_ms,
                                                 cree_le=incident.cree_le))

    return SanteStats(
        etat_global=etat_global,
        nb_appels=total_appels,
        nb_erreurs=total_erreurs,
        taux_erreur=taux_erreur_global,
        par_source=par_source,
        derniers_incidents=derniers_incidents,
    )