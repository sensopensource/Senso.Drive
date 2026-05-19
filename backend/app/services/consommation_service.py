from sqlalchemy.orm import Session
from app.models.consommations_tokens import ConsommationTokens


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