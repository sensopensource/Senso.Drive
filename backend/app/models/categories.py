from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey,UniqueConstraint
from app.database import Base
from sqlalchemy.sql import func 

class Categorie(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True)
    nom= Column(Text,nullable=False)
    id_parent = Column(Integer,ForeignKey("categories.id"))
    id_utilisateur = Column(Integer,ForeignKey("utilisateurs.id"),nullable=False)

    __table_args__=(
        UniqueConstraint("nom","id_utilisateur",name="unique_cat_nom_user"),
    )