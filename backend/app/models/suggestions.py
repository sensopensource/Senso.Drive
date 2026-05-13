from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey
from app.database import Base
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSONB

class Suggestion(Base):
    __tablename__ = "suggestions"

    id = Column(Integer, primary_key=True)
    id_utilisateur = Column(Integer, ForeignKey('utilisateurs.id'), nullable=False)
    type = Column(Text, nullable=False)
    payload = Column(JSONB, nullable=False)
    statut = Column(Text, nullable=False, default='en_attente')
    raison_refus = Column(Text)
    date_creation = Column(DateTime(timezone=True), server_default=func.now())
    date_traitement = Column(DateTime(timezone=True))
