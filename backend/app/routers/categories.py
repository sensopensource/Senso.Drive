from fastapi import APIRouter,Depends
from app.models.utilisateurs import Utilisateur
from app.core.dependencies import get_current_user
from app.schemas.categorie import CategorieCreate,CategorieRead
from app.services import categorie_service
from sqlalchemy.orm import Session
from app.database import get_db
from fastapi import HTTPException

router = APIRouter(prefix="/categories",tags=["categories"])

@router.get("")
def list_categories(current_user: Utilisateur = Depends(get_current_user),
                    db: Session = Depends(get_db)
                    ) -> list[CategorieRead]:
    
    categories = categorie_service.list_categories(current_user.id,db=db)

    return categories


@router.post("")
def creer_categorie(nom: str,
                    current_user: Utilisateur = Depends(get_current_user),
                    db: Session = Depends(get_db)) -> CategorieRead:
    categorie = categorie_service.create_categorie(db=db,
                                                   nom=nom,
                                                   id_utilisateur=current_user.id)
    return categorie

@router.patch("")
def modifier_categorie(id_categorie: int,
                       nom: str,
                       db: Session = Depends(get_db),
                       current_user= Depends(get_current_user)) -> CategorieRead:
    categorie = categorie_service.patch_categorie(db=db,
                                                  id_categorie=id_categorie,
                                                  nom=nom,
                                                  id_utilisateur=current_user.id)
    return categorie
    
@router.delete("/{id_categorie}")
def delete_categorie(id_categorie:int,
                    db: Session= Depends(get_db),
                    current_user: Utilisateur = Depends(get_current_user)):
    if not categorie_service.delete_categorie(db=db,
                                            id_categorie=id_categorie,
                                            id_utilisateur=current_user.id):
        raise HTTPException(status_code=404,detail="categorie non trouve")
    else:
        return {"message": "categorie supprime avec succes"}