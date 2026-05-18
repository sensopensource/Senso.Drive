from sqlalchemy.orm import Session
from app.models.logs import Log


def log_action(db: Session,
               niveau: str,
               action: str,
               message: str,
               contexte: dict | None = None,
               id_utilisateur: int | None = None,
               adresse_ip: str | None = None) -> None:

    log = Log(
        id_utilisateur=id_utilisateur,
        niveau=niveau,
        action=action,
        message=message,
        contexte=contexte,
        adresse_ip=adresse_ip,
    )
    db.add(log)
    db.commit()
