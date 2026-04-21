from fastapi import APIRouter,Depends
from app.models.utilisateurs import Utilisateur
from app.core.dependencies import get_current_user
from app.schemas.categorie import CategorieCreate,CategorieRead
from app.services import categorie_service
from sqlalchemy.orm import Session
from app.database import get_db

router = APIRouter(prefix="/categories",tags=["categories"])

@router.get("")
def list_categories(current_user: Utilisateur = Depends(get_current_user),
                    db: Session = Depends(get_db)
                    ) -> list[CategorieRead]:
    
    categories = categorie_service.list_categories(current_user.id,db=db)

    return categories


