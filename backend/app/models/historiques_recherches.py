from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey
from app.database import Base
from sqlalchemy.sql import func

class HistoriqueRecherche(Base):
    __tablename__ = "historiques_recherches"

    id = Column(Integer, primary_key=True)
    requete = Column(Text, nullable=False)
    date_recherche = Column(DateTime(timezone=True), server_default=func.now())
    id_utilisateur = Column(Integer, ForeignKey('utilisateurs.id'), nullable=False)
    nb_resultats = Column(Integer, nullable=False)
