from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey
from app.database import Base
from sqlalchemy.sql import func 
from sqlalchemy.orm import relationship


class Document(Base):
    __tablename__= "documents"

    id = Column(Integer, primary_key=True)
    titre = Column(Text, nullable=False)
    auteur = Column(Text)
    date_creation = Column(DateTime(timezone=True), server_default= func.now())
    id_utilisateur = Column(Integer,ForeignKey('utilisateurs.id'), nullable=False) 
    id_categorie = Column(Integer,ForeignKey('categories.id'),nullable=False)

    versions = relationship(
    "Version",
    back_populates="document",
    cascade="all,delete-orphan"

    )