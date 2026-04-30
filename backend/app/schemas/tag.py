from pydantic import BaseModel, ConfigDict
from datetime import datetime


class TagCreate(BaseModel):
    name: str


class DocumentTagsUpdate(BaseModel):
    tag_ids: list[int]


class TagRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    color: str
    created_at: datetime
