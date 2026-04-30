from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey, UniqueConstraint, Table
from app.database import Base
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship


documents_tags = Table(
    "documents_tags",
    Base.metadata,
    Column("id_document", Integer, ForeignKey("documents.id"), primary_key=True),
    Column("id_tag", Integer, ForeignKey("tags.id"), primary_key=True),
)


class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True)
    name = Column(Text, nullable=False)
    color = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    id_utilisateur = Column(Integer, ForeignKey("utilisateurs.id"), nullable=False)

    documents = relationship(
        "Document",
        secondary=documents_tags,
        back_populates="tags"
    )

    __table_args__ = (
        UniqueConstraint("name", "id_utilisateur", name="unique_tag_name_user"),
    )
