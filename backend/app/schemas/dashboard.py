from pydantic import BaseModel


class DashboardUtilisateur(BaseModel):
    documents_total: int
    docs_par_type: dict[str, int]
    suggestions_en_attente: int
