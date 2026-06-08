import time

from app.database import SessionLocal
from app.models.versions import Version
from app.services.document_service import get_next, traiter
from app.services.extraction import is_image_type

POLL_SECONDS = 5


def reinitialiser_orphelins():
    db = SessionLocal()
    try:
        orphelins = db.query(Version).filter(Version.etat == "en_cours").all()
        for version in orphelins:
            if is_image_type(version.type_fichier):
                version.etat = "a_analyser"
            else:
                version.etat = "a_resumer"
        db.commit()
    finally:
        db.close()


def boucle():
    reinitialiser_orphelins()
    while True:
        try:
            db = SessionLocal()
            try:
                claim = get_next(db)
            finally:
                db.close()

            if claim is None:
                time.sleep(POLL_SECONDS)
                continue

            document_id, id_utilisateur = claim
            traiter(document_id, id_utilisateur)
        except Exception as e:
            print(f"[worker] erreur boucle : {e}", flush=True)
            time.sleep(POLL_SECONDS)


if __name__ == "__main__":
    boucle()
