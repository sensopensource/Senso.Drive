from pydantic import BaseModel,ConfigDict

class CategorieCreate(BaseModel):
    nom: str 

class CategorieRead(BaseModel):
    model_config=ConfigDict(from_attributes=True)
    nom: str
    id: int
  
