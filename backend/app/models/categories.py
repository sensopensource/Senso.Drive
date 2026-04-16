from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey
from app.database import Base
from sqlalchemy.sql import func 

class Categorie(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True)
    nom= Column(Text,unique=True,nullable=False)
    id_parent = Column(Integer,ForeignKey("categories.id"))