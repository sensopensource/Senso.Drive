from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from app.database import Base


class Log(Base):
    __tablename__ = "logs"

    id             = Column(Integer, primary_key=True)
    id_utilisateur = Column(Integer, ForeignKey('utilisateurs.id'), nullable=True)
    niveau         = Column(Text, nullable=False)
    action         = Column(Text, nullable=False)
    message        = Column(Text, nullable=False)
    contexte       = Column(JSONB, nullable=True)
    adresse_ip     = Column(Text, nullable=True)
    cree_le        = Column(DateTime(timezone=True), server_default=func.now())
