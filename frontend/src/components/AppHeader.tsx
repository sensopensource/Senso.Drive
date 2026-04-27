import { Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

function AppHeader() {
  const { logout } = useAuth()

  return (
    <header className="flex items-center justify-between px-6 h-14 border-b border-border">

      {/* Wordmark — clic ramène au dashboard */}
      <Link to="/home" className="flex items-center gap-1 hover:opacity-80 transition-opacity">
        <span className="font-mono text-sm font-medium text-fg-1">SENSO</span>
        <span className="font-mono text-sm text-fg-2">.DRIVE</span>
      </Link>

      {/* Bouton déconnexion */}
      <button
        onClick={logout}
        className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-fg-2 hover:text-fg-1 transition-colors"
      >
        <span className="material-symbols-outlined text-base">logout</span>
        Déconnexion
      </button>
    </header>
  )
}

export default AppHeader
