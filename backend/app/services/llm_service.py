import time
import httpx
import anthropic
from sqlalchemy.orm import Session
from app.services import consommation_service
from app.core.config import ANTHROPIC_API_KEY, OLLAMA_BASE_URL, OLLAMA_MODEL, LLM_RESUME_BACKEND

client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)


def generer_resume(db: Session, id_utilisateur: int, contenu: str) -> str:
    if LLM_RESUME_BACKEND == "ollama":
        return _resume_ollama(db=db, id_utilisateur=id_utilisateur, contenu=contenu)
    else:
        return _resume_anthropic(db=db, id_utilisateur=id_utilisateur, contenu=contenu)


def _resume_ollama(db: Session, id_utilisateur: int, contenu: str) -> str:
    debut = time.perf_counter()
    modele = OLLAMA_MODEL
    prompt = f"Résume ce document en français de manière concise et structurée :\n\n{contenu}"
    try:
        response = httpx.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={
                "model":   modele,
                "prompt":  prompt,
                "stream":  False,
                "options": {"temperature": 0.3, "num_predict": 1024},
            },
            timeout=httpx.Timeout(600.0),
        )
        response.raise_for_status()
        data = response.json()
        latence_ms = int((time.perf_counter() - debut) * 1000)

        consommation_service.enregistrer(
            db=db,
            id_utilisateur=id_utilisateur,
            source="resume",
            modele=modele,
            tokens_in=data.get("prompt_eval_count", 0),
            tokens_out=data.get("eval_count", 0),
            latence_ms=latence_ms,
            statut="ok",
        )
        return data["response"]

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
            message_erreur=str(e),
        )
        raise


def _resume_anthropic(db: Session, id_utilisateur: int, contenu: str) -> str:
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
