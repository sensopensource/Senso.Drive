import { Link, useNavigate, useLocation } from "react-router-dom"
import { type ChangeEvent } from "react"
import { useAuth } from "../contexts/AuthContext"
import { useSearch } from "../contexts/SearchContext"

function TopBar() {
  const { user } = useAuth()
  const { query, setQuery } = useSearch()
  const navigate = useNavigate()
  const location = useLocation()

  const initials = user?.nom ? user.nom.slice(0, 2).toUpperCase() : '—'

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    if (value.length > 0 && location.pathname !== '/documents') {
      navigate('/documents')
    }
  }

  return (
    <header className="h-12 flex items-center hair-b shrink-0 bg-ink/95 backdrop-blur-xl relative z-20">

      {/* Brand */}
      <Link
        to="/home"
        className="w-[280px] px-5 flex items-center gap-2.5 hair-r h-full hover:opacity-80 transition-opacity"
      >
        <div className="w-5 h-5 hair flex items-center justify-center">
          <span className="material-symbols-outlined text-[12px] text-soft">inventory_2</span>
        </div>
        <span className="text-[13px] font-semibold tracking-tight text-bright">Senso</span>
        <span className="text-[13px] font-mono text-mute">.Drive</span>
      </Link>

      {/* Search */}
      <div className="flex-1 h-full flex items-center px-4">
        <div className="flex items-center gap-2 w-full max-w-[480px]">
          <span className="material-symbols-outlined text-[16px] text-mute">search</span>
          <input
            type="text"
            value={query}
            onChange={handleSearchChange}
            placeholder="Rechercher dans vos documents…"
            autoComplete="off"
            className="flex-1 bg-transparent border-none text-[13px] placeholder:text-mute text-bright p-0"
          />
          <kbd>⌘K</kbd>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1 px-3 h-full">
        <button className="w-8 h-8 flex items-center justify-center text-mute hover:text-bright transition-colors" aria-label="Notifications">
          <span className="material-symbols-outlined text-[18px]">notifications</span>
        </button>
        <button className="w-8 h-8 flex items-center justify-center text-mute hover:text-bright transition-colors" aria-label="Paramètres">
          <span className="material-symbols-outlined text-[18px]">settings</span>
        </button>
        <div className="w-7 h-7 ml-2 hair bg-elev flex items-center justify-center" title={user?.email}>
          <span className="text-[10px] font-mono text-soft">{initials}</span>
        </div>
      </div>
    </header>
  )
}

export default TopBar
