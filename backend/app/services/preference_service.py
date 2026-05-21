from sqlalchemy.orm import Session
from app.models.preferences_utilisateur_dashboard import PreferenceUtilisateurDashboard


def get_preference(db: Session, id_utilisateur: int) -> PreferenceUtilisateurDashboard | None:
    return (db.query(PreferenceUtilisateurDashboard)
              .filter(PreferenceUtilisateurDashboard.id_utilisateur == id_utilisateur)
              .first())


def set_layout(db: Session, id_utilisateur: int, layout) -> PreferenceUtilisateurDashboard:
    preference = get_preference(db, id_utilisateur)
    if preference is None:
        preference = PreferenceUtilisateurDashboard(id_utilisateur=id_utilisateur, layout=layout)
        db.add(preference)
    else:
        preference.layout = layout
    db.commit()
    db.refresh(preference)
    return preference
