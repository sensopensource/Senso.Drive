import time
from app.services import consommation_service
from sqlalchemy.orm import Session

import anthropic
from app.core.config import ANTHROPIC_API_KEY

client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

def generer_resume(db: Session, id_utilisateur: int, contenu: str) -> str:
    debut = time.perf_counter()
    modele = "claude-sonnet-4-6"
    try:
        message = client.messages.create(
            model=modele,
            max_tokens=1024,
            messages=[
                {
                    "role": "user",
                    "content": f"Résume ce document en français de manière concise et structurée :\n\n{contenu}"
                }
            ]
        )
        latence_ms = int((time.perf_counter() - debut) * 1000)
        
        consommation_service.enregistrer(
            db=db,
            id_utilisateur=id_utilisateur,
            source="resume",
            modele=modele,
            tokens_in=message.usage.input_tokens,
            tokens_out=message.usage.output_tokens,
            latence_ms=latence_ms,
            statut="ok"
        )

        return message.content[0].text
    


    except anthropic.BadRequestError as e:
        
        consommation_service.enregistrer(
            db=db,
            id_utilisateur=id_utilisateur,
            source="resume",
            modele=modele,
            tokens_in=0,
            tokens_out=0,
            latence_ms=int((time.perf_counter() - debut) * 1000),
            statut="err",
            message_erreur=str(e)
        )
        if "Your credit balance is too low" in str(e):
            raise Exception("Le résumé automatique est temporairement indisponible en raison de limites de crédit. Veuillez réessayer plus tard.")
        raise  

    except Exception as e:
        
        consommation_service.enregistrer(
            db=db,
            id_utilisateur=id_utilisateur,
            source="resume",
            modele=modele,
            tokens_in=0,
            tokens_out=0,
            latence_ms=int((time.perf_counter() - debut) * 1000),
            statut="err",
            message_erreur=str(e)
        )
        raise