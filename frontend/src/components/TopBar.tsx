import { Link, useNavigate } from "react-router-dom"
import { useState, useRef, useEffect, type ChangeEvent, type KeyboardEvent, type MouseEvent as ReactMouseEvent } from "react"
import { useAuth } from "../contexts/AuthContext"
import { useSearchDocuments } from "../hooks/useSearchDocuments"
import { useDebounce } from "../hooks/useDebounce"
import {
  useHistorique,
  useCreateHistorique,
  useDeleteHistorique,
  useViderHistorique,
} from "../hooks/useHistorique"

const PREVIEW_LIMIT = 5

function TopBar() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const debouncedQuery = useDebounce(query, 300)
  const { results, isLoading } = useSearchDocuments(debouncedQuery)
  const preview = results.slice(0, PREVIEW_LIMIT)

  const { historique } = useHistorique()
  const { createHistorique } = useCreateHistorique()
  const { deleteHistorique } = useDeleteHistorique()
  const { viderHistorique } = useViderHistorique()

  const initials = user?.nom ? user.nom.slice(0, 2).toUpperCase() : '—'

  // Fermer au clic en dehors
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    setIsOpen(true)
  }

  const goToResults = () => {
    if (!query.trim()) return
    navigate(`/documents?query=${encodeURIComponent(query)}`)
    setIsOpen(false)
    inputRef.current?.blur()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      goToResults()
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      inputRef.current?.blur()
    }
  }

  const handleResultClick = (id: number) => {
    // Spec : on enregistre dans l'historique seulement si l'user clique sur un resultat ET avait saisi une query
    if (debouncedQuery.trim()) {
      createHistorique({ requete: debouncedQuery, nb_resultats: results.length })
    }
    navigate(`/documents?focus=${id}`)
    setIsOpen(false)
  }

  const handleHistoriqueClick = (requete: string) => {
    setQuery(requete)
  }

  const handleDeleteHistorique = (e: ReactMouseEvent, id: number) => {
    e.stopPropagation()
    deleteHistorique(id)
  }

  const handleViderHistorique = (e: ReactMouseEvent) => {
    e.stopPropagation()
    viderHistorique()
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
        <div ref={containerRef} className="relative w-full max-w-[480px]">
          <div className="flex items-center gap-2 h-full">
            <span className="material-symbols-outlined text-[16px] text-mute">search</span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleChange}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder="Rechercher dans vos documents…"
              autoComplete="off"
              className="flex-1 bg-transparent border-none text-[13px] placeholder:text-mute text-bright p-0 outline-none"
            />
            <kbd>⌘K</kbd>
          </div>

          {/* Dropdown */}
          {isOpen && (
            <div className="absolute top-[calc(100%+4px)] left-0 right-0 hair bg-ink/98 backdrop-blur-xl shadow-lg max-h-[70vh] overflow-y-auto">

              {/* Etat : query vide → historique */}
              {!debouncedQuery && (
                <>
                  {historique.length === 0 ? (
                    <div className="p-4 text-[12px] text-mute font-mono">
                      Tapez pour rechercher…
                    </div>
                  ) : (
                    <div>
                      <div className="px-4 py-2 hair-b flex items-center justify-between">
                        <span className="text-[10.5px] font-mono text-mute uppercase tracking-wider">Recherches récentes</span>
                        <button
                          onClick={handleViderHistorique}
                          className="text-[10.5px] font-mono text-mute hover:text-bright transition-colors"
                        >
                          Tout effacer
                        </button>
                      </div>
                      {historique.map(h => (
                        <button
                          key={h.id}
                          onClick={() => handleHistoriqueClick(h.requete)}
                          className="w-full text-left px-4 py-2 hover:bg-elev hair-b last:border-b-0 transition-colors flex items-center gap-2 group"
                        >
                          <span className="material-symbols-outlined text-[14px] text-mute">history</span>
                          <span className="text-[12.5px] text-soft truncate flex-1">{h.requete}</span>
                          <span
                            onClick={(e) => handleDeleteHistorique(e, h.id)}
                            className="opacity-0 group-hover:opacity-100 text-mute hover:text-bright transition-all cursor-pointer"
                            aria-label="Supprimer"
                          >
                            <span className="material-symbols-outlined text-[14px]">close</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Etat : query non vide, loading */}
              {debouncedQuery && isLoading && (
                <div className="p-4 text-[12px] text-mute font-mono">
                  Recherche…
                </div>
              )}

              {/* Etat : query non vide, aucun resultat */}
              {debouncedQuery && !isLoading && results.length === 0 && (
                <div className="p-4 text-[12px] text-soft">
                  Aucun résultat pour « {debouncedQuery} ».
                </div>
              )}

              {/* Etat : resultats */}
              {debouncedQuery && !isLoading && preview.length > 0 && (
                <div>
                  {preview.map(doc => (
                    <button
                      key={doc.id}
                      onClick={() => handleResultClick(doc.id)}
                      className="w-full text-left px-4 py-2.5 hover:bg-elev hair-b last:border-b-0 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-[14px] text-mute">description</span>
                        <span className="text-[13px] text-bright truncate">{doc.titre}</span>
                      </div>
                      {doc.extrait && (
                        <div
                          className="text-[11px] text-soft line-clamp-2 pl-6"
                          dangerouslySetInnerHTML={{ __html: doc.extrait }}
                        />
                      )}
                    </button>
                  ))}

                  {results.length > PREVIEW_LIMIT && (
                    <button
                      onClick={goToResults}
                      className="w-full px-4 py-2.5 text-left text-[11px] font-mono text-mute hover:text-bright hair-t hover:bg-elev transition-colors flex items-center justify-between"
                    >
                      <span>Voir tous les résultats ({results.length})</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
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
