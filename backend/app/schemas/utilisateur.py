from datetime import datetime
from pydantic import BaseModel,EmailStr,ConfigDict


class UtilisateurRegister(BaseModel):
    email: EmailStr
    password: str
    nom: str


class UtilisateurLogin(BaseModel):

    email: EmailStr
    password: str

class UtilisateurRead(BaseModel):
    model_config=ConfigDict(from_attributes=True)
    email: EmailStr
    nom: str
    role: str
    id: int
    

class UtilisateurAdminRow(BaseModel):
    id: int
    nom: str
    email: EmailStr
    role: str
    date_inscription: datetime
    nb_documents: int
    tokens_30j: int
    nb_suggestions: int
    dernier_login: datetime | None = None


class UtilisateurAdminDetail(UtilisateurAdminRow):
    stockage_octets: int


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"