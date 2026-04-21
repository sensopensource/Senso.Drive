from sqlalchemy.orm import Session
from app.models.categories import Categorie
from app.models.documents import Document


def list_categories(id_utilisateur: int,
                    db: Session) -> list[Categorie]:

    categories = db.query(Categorie).filter(Categorie.id_utilisateur==id_utilisateur).all()

    return categories


def get_categorie(document: Document,
                  db: Session) -> Categorie:
    
    categorie = db.query(Categorie).filter(Categorie.id == document.id_categorie).first()

    return categorie

def create_categorie(db: Session,
                     nom: str,
                     id_utilisateur: int) -> Categorie:
    categorie = Categorie(nom=nom,
                          id_utilisateur=id_utilisateur)
    db.add(categorie)
    db.commit()
    db.refresh(categorie)

    return categorie


    
