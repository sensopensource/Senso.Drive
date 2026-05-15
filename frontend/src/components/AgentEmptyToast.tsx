import { useAgent } from "../contexts/AgentContext"

function AgentEmptyToast() {
  const { emptyToastOpen, closeEmptyToast } = useAgent()

  if (!emptyToastOpen) return null

  return (
    <div className="empty-toast">
      <span className="material-symbols-outlined check-icon">check_circle</span>
      <div className="flex-1">
        <div className="empty-title">Ta bibliothèque est bien organisée</div>
        <div className="empty-desc">L'agent n'a rien à proposer pour l'instant.</div>
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
