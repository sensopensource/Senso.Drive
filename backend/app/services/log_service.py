from sqlalchemy.orm import Session
from app.models.logs import Log


def log_action(db: Session,
               action: str,
               details: str,
               id_utilisateur: int | None = None,
               adresse_ip: str | None = None) -> None:
    """Enregistre une action dans la table logs.

    Pattern d'appel : depuis un router (qui a la Request pour l'IP) ou un service.
    On commit sur place — chaque log est independant des autres operations.
    """
    log = Log(
        id_utilisateur=id_utilisateur,
        action=action,
        details=details,
        adresse_ip=adresse_ip or "unknown",
    )
    db.add(log)
    db.commit()
