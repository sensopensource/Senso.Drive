import anthropic
from app.core.config import ANTHROPIC_API_KEY

client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

def generer_resume(contenu: str) -> str:
    try:
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            messages=[
                {
                    "role": "user",
                    "content": f"Résume ce document en français de manière concise et structurée :\n\n{contenu}"
                }
            ]
        )
        return message.content[0].text
    except anthropic.BadRequestError as e:
        if "Your credit balance is too low" in str(e):
            raise Exception("Le résumé automatique est temporairement indisponible en raison de limites de crédit. Veuillez réessayer plus tard.")
        raise  