import anthropic
from sqlalchemy.orm import Session

from app.core.config import ANTHROPIC_API_KEY
from app.models.categories import Categorie
from app.services import categorie_service


client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)


def collect_context(db: Session, id_utilisateur: int) -> list[dict]:
      documents = categorie_service.list_documents_visibles_pour_agent(db, id_utilisateur)

     
      categories = db.query(Categorie).filter(Categorie.id_utilisateur == id_utilisateur).all()

      cat_par_id = {}
      for c in categories:
        cat_par_id[c.id] = c.nom

      contexte = []
      for doc in documents:

          derniere_version = max(doc.versions, key=lambda v: v.numero)

          
          if derniere_version.resume_llm:
              contenu = f"Résumé : {derniere_version.resume_llm}"
          else:
              contenu = f"Extrait : {derniere_version.contenu[:500]}"

          contexte.append({
              "id": doc.id,
              "titre": doc.titre,
              "auteur": doc.auteur,
              "categorie_id": doc.id_categorie,
              "categorie": cat_par_id.get(doc.id_categorie),
              "tags": [t.name for t in doc.tags],
              "type_fichier": derniere_version.type_fichier,
              "date_creation": doc.date_creation.isoformat() if doc.date_creation else None,
              "date_dernier_upload": derniere_version.date_upload.isoformat() if derniere_version.date_upload else None,
              "contenu": contenu,
          })

      return contexte

SUGGESTIONS_TOOL = {"name": "submit_suggestions",
                    "description": "Soumet les suggestions d'organisation à l'utilisateur.",
                    "input_schema": {"type": "object",
                                     "properties": {"suggestions": {"type": "array",
                                                                    "maxItems": 5,
                                                                    "items": {"type": "object",
                                                                              "properties": {"type": {"type": "string",
                                                                                                      "enum": ["regroupement", "suppression", "tag"],},
                                                                                             "explication": {"type": "string",
                                                                                                             "description": "1-2 phrases expliquant pourquoi cette suggestion.",},
                                                                                             "document_ids": {"type": "array",
                                                                                                              "items": {"type": "integer"},},
                                                                                             "categorie_cible_id": {"type": ["integer", "null"],
                                                                                                                    "description": "Pour 'regroupement' : id d'une categorie existante, ou null pour en creer une nouvelle.",},
                                                                                             "categorie_cible_nom": {"type": ["string", "null"],
                                                                                                                    "description": "Pour 'regroupement' : nom de la categorie (existante ou a creer).",},
                                                                                             "tag_name": {"type": ["string", "null"],
                                                                                                          "description": "Pour 'tag' : nom du tag a ajouter.",},},
                                                                     "required": ["type", "explication", "document_ids"],},}},
                      "required": ["suggestions"],},}

PROMPT_SYSTEME = """

Tu es l'assistant d'organisation de Senso.Drive, un système de gestion
de documents personnels. Ton rôle est d'analyser la bibliothèque de
documents de l'utilisateur et de proposer des actions concrètes pour
mieux l'organiser.

Tu peux proposer 3 types de suggestions :

1. REGROUPEMENT : créer une nouvelle catégorie pour rassembler des
   documents qui parlent du même sujet et qui sont actuellement
   éparpillés. Minimum 2 documents.

2. SUPPRESSION : identifier des documents en doublon ou quasi-doublon
   (≥ 90% similaires sur le contenu, ou versions oubliées du même
   fichier). Les documents seront mis en corbeille (réversible), pas
   supprimés définitivement.

3. TAG : suggérer d'ajouter un tag commun à un groupe de documents
   qui partagent une caractéristique transversale (ex : "urgent",
   "2024", "client X").

Règles strictes :
- Tu ne proposes que des suggestions à HAUTE confiance.
- Si tu n'es pas sûr, tu ne proposes rien.
- Maximum 5 suggestions par analyse.
- Pour chaque suggestion, fournis une explication courte (1-2 phrases)
  qui sera montrée à l'utilisateur.
- Ne propose JAMAIS de toucher aux documents que tu n'as pas reçus
  dans le contexte (ils peuvent être privés).

Tu reçois la liste des documents au format :
[
  { "id": 5, "titre": "...", "auteur": "...", "categorie": "...",
    "tags": [...], "date_creation": "...", "contenu": "Résumé : ..." },
  ...
]

Utilise l'outil submit_suggestions pour répondre.

                 """

def call_agent(documents: list[dict], categories: list[dict]) -> list[dict]:
   
    user_message = ( f"Voici la bibiliotheque de l'utilisateur:\n\n"
                     f"Documents : {documents}\n\n"
                     f"Catégories : {categories}\n\n"
                     f"analyse cette bibliotheque et propose 5 suggestion via l'outil submit_suggestions pour aider l'utilisateur a mieux organiser sa bibliotheque.")
    
    response = client.messages.create(model="claude-haiku-4-5-20251001",
                                      max_tokens=3333,
                                      system= PROMPT_SYSTEME,
                                      tools=[SUGGESTIONS_TOOL],
                                      tool_choice={"type":"tool","name":"submit_suggestions"},
                                      messages=[{"role": "user", "content": user_message}])
    
    for block in response.content:
        if block.type == "tool_use" and block.name == "submit_suggestions":
            return block.input["suggestions"]
        
    return []