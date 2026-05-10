from sqlalchemy.orm import Session 
from app.models.historiques_recherches import HistoriqueRecherche

LIMITE_HISTORIQUE = 20

def create(db: Session, id_utilisateur: int, requete: str, nb_resultats: int)-> HistoriqueRecherche:
    historique = HistoriqueRecherche(
        id_utilisateur=id_utilisateur,
        requete=requete,
        nb_resultats=nb_resultats
    )
    db.add(historique)
    db.flush()  # Flush pour obtenir l'ID

    surplus = (db.query(HistoriqueRecherche)
                .filter(HistoriqueRecherche.id_utilisateur == id_utilisateur)
                .order_by(HistoriqueRecherche.date_recherche.desc())
                .offset(LIMITE_HISTORIQUE)
                .all())
    
    for hist in surplus:
        db.delete(hist)


    db.commit()
    db.refresh(historique)
    return historique

def list_historique(db: Session, id_utilisateur: int) -> list[HistoriqueRecherche]:
    return (
        db.query(HistoriqueRecherche)
        .filter(HistoriqueRecherche.id_utilisateur == id_utilisateur)
        .order_by(HistoriqueRecherche.date_recherche.desc())
        .limit(LIMITE_HISTORIQUE)
        .all()
    )

def delete_one(db: Session, id_utilisateur: int, id_historique: int) -> bool:
    historique = (db.query(HistoriqueRecherche)
                  .filter(HistoriqueRecherche.id == id_historique,
                          HistoriqueRecherche.id_utilisateur == id_utilisateur)
                  .first())
    if not historique:
        return False
    db.delete(historique)
    db.commit()
    return True

def delete_all(db: Session, id_utilisateur: int) -> int:
    count = (
        db.query(HistoriqueRecherche)
        .filter(HistoriqueRecherche.id_utilisateur == id_utilisateur)
        .delete()
    )
    db.commit()
    return count