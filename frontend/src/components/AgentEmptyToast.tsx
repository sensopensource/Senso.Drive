import { useAgent } from "../contexts/AgentContext"
import { LABELS } from "../lib/labels"

function AgentEmptyToast() {
  const { emptyToastOpen, closeEmptyToast } = useAgent()

  if (!emptyToastOpen) return null

  return (
    <div className="empty-toast">
      <span className="material-symbols-outlined check-icon">check_circle</span>
      <div className="flex-1">
        <div className="empty-title">Votre bibliothèque est bien organisée</div>
        <div className="empty-desc">{LABELS.slavy.nom} n'a rien à proposer pour l'instant.</div>
      </div>
      <button
        type="button"
        onClick={closeEmptyToast}
        className="empty-close"
        aria-label="Fermer"
      >
        ×
      </button>
    </div>
  )
}

export default AgentEmptyToast
