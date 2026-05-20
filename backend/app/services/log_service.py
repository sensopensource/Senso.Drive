from datetime import datetime
from sqlalchemy.orm import Session
from app.models.logs import Log
from app.schemas.log import LogRead, LogListResponse
from app.services.log_broadcaster import broadcaster


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

    if broadcaster.abonnes:
        charge = LogRead.model_validate(log).model_dump(mode="json")
        broadcaster.diffuser(charge)


def list_logs(db: Session,
              page: int = 1,
              size: int = 50,
              niveau: str | None = None,
              action: str | None = None,
              id_utilisateur: int | None = None,
              date_debut: datetime | None = None,
              date_fin: datetime | None = None) -> LogListResponse:

    base_query = db.query(Log)

    if niveau is not None:
        base_query = base_query.filter(Log.niveau == niveau)
    if action is not None:
        base_query = base_query.filter(Log.action == action)
    if id_utilisateur is not None:
        base_query = base_query.filter(Log.id_utilisateur == id_utilisateur)
    if date_debut is not None:
        base_query = base_query.filter(Log.cree_le >= date_debut)
    if date_fin is not None:
        base_query = base_query.filter(Log.cree_le <= date_fin)

    total = base_query.count()
    offset = (page - 1) * size

    logs = (base_query
            .order_by(Log.cree_le.desc())
            .offset(offset)
            .limit(size)
            .all())

    items = [LogRead.model_validate(log) for log in logs]

    return LogListResponse(items=items, total=total, page=page, size=size)
