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
        id_utilisateur=new_user.id,
        action="auth.register",
        details=f"Compte cree pour {email}",
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
            id_utilisateur=None,
            action="auth.login.failed",
            details=f"Email inconnu : {email}",
            adresse_ip=adresse_ip,
        )
        return None

    if not verify_password(password, user.mot_de_passe_hash):
        log_service.log_action(
            db=db,
            id_utilisateur=user.id,
            action="auth.login.failed",
            details="Mot de passe incorrect",
            adresse_ip=adresse_ip,
        )
        return None

    log_service.log_action(
        db=db,
        id_utilisateur=user.id,
        action="auth.login.success",
        details="Connexion reussie",
        adresse_ip=adresse_ip,
    )

    return user
