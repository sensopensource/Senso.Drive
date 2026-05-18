from app.core.security import verify_password, hash_password
from app.models.utilisateurs import Utilisateur
from sqlalchemy.orm import Session
from app.services import log_service


def register_utilisateur(db: Session,
                         nom: str,
                         email: str,
                         password: str,
                         adresse_ip: str | None = None,
                         role: str = "user"
                         ) -> Utilisateur | None:

    mail_existe = db.query(Utilisateur).filter(Utilisateur.email == email).first()
    if mail_existe:
        return None

    hash = hash_password(password=password)

    new_user = Utilisateur(
        nom=nom,
        email=email,
        mot_de_passe_hash=hash,
        role=role,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    log_service.log_action(
        db=db,
        niveau="ok",
        action="auth.register",
        message=f"Compte cree pour {email}",
        contexte={"email": email},
        id_utilisateur=new_user.id,
        adresse_ip=adresse_ip,
    )

    return new_user


def auth_utilisateur(db: Session,
                     email: str,
                     password: str,
                     adresse_ip: str | None = None) -> Utilisateur | None:
    user = db.query(Utilisateur).filter(Utilisateur.email == email).first()

    if not user:
        log_service.log_action(
            db=db,
            niveau="warn",
            action="auth.login.failed",
            message=f"Email inconnu : {email}",
            contexte={"email": email, "raison": "email_inconnu"},
            id_utilisateur=None,
            adresse_ip=adresse_ip,
        )
        return None

    if not verify_password(password, user.mot_de_passe_hash):
        log_service.log_action(
            db=db,
            niveau="warn",
            action="auth.login.failed",
            message="Mot de passe incorrect",
            contexte={"email": email, "raison": "mot_de_passe_incorrect"},
            id_utilisateur=user.id,
            adresse_ip=adresse_ip,
        )
        return None

    log_service.log_action(
        db=db,
        niveau="ok",
        action="auth.login.success",
        message="Connexion reussie",
        contexte={"email": email},
        id_utilisateur=user.id,
        adresse_ip=adresse_ip,
    )

    return user
