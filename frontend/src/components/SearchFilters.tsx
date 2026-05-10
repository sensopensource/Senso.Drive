import { useEffect, useRef, useState } from "react"
import { useAuteurs } from "../hooks/useAuteurs"
import { useCategories } from "../hooks/useCategories"
import { useTags } from "../hooks/useTags"

type Props = {
  searchParams: URLSearchParams
  setSearchParams: (next: URLSearchParams, opts?: { replace?: boolean }) => void
}

const FILTER_KEYS = ['type_fichier', 'auteur', 'cat', 'id_tags', 'date_debut', 'date_fin']

function SearchFilters({ searchParams, setSearchParams }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const { auteurs } = useAuteurs()
  const { categories } = useCategories()
  const { data: tags = [] } = useTags()

  // Lecture des filtres actifs depuis l'URL
  const typeFichier = searchParams.get('type_fichier') ?? ''
  const auteur = searchParams.get('auteur') ?? ''
  const idCategorie = searchParams.get('cat') ?? ''
  const idTags = searchParams.getAll('id_tags').map(Number)
  const dateDebut = searchParams.get('date_debut') ?? ''
  const dateFin = searchParams.get('date_fin') ?? ''

  const activeCount = FILTER_KEYS.filter(k => {
    const all = searchParams.getAll(k)
    return all.length > 0 && all.some(v => v !== '')
  }).length

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

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    setSearchParams(next, { replace: true })
  }

  const toggleTag = (tagId: number) => {
    const next = new URLSearchParams(searchParams)
    const current = next.getAll('id_tags').map(Number)
    next.delete('id_tags')
    const updated = current.includes(tagId)
      ? current.filter(id => id !== tagId)
      : [...current, tagId]
    updated.forEach(id => next.append('id_tags', String(id)))
    setSearchParams(next, { replace: true })
  }

  const resetFilters = () => {
    const next = new URLSearchParams(searchParams)
    FILTER_KEYS.forEach(k => next.delete(k))
    setSearchParams(next, { replace: true })
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(o => !o)}
        className="btn-ghost flex items-center gap-1.5 bg-transparent"
      >
        <span className="material-symbols-outlined text-[15px]">tune</span>
        <span>Filtres</span>
        {activeCount > 0 && (
          <span className="ml-1 px-1.5 hair text-[10px] font-mono text-bright bg-elev">
            {activeCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] right-0 hair bg-ink/98 backdrop-blur-xl shadow-lg w-[320px] z-30 p-4 flex flex-col gap-4">

          {/* Type de fichier */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10.5px] font-mono text-mute uppercase tracking-wider">Type</label>
            <select
              value={typeFichier}
              onChange={e => updateParam('type_fichier', e.target.value)}
              className="hair bg-transparent text-[12.5px] text-bright px-2 py-1.5 outline-none [&>option]:bg-ink [&>option]:text-bright"
            >
              <option value="">Tous</option>
              <option value="pdf">PDF</option>
              <option value="docx">DOCX</option>
            </select>
          </div>

          {/* Auteur */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10.5px] font-mono text-mute uppercase tracking-wider">Auteur</label>
            <select
              value={auteur}
              onChange={e => updateParam('auteur', e.target.value)}
              className="hair bg-transparent text-[12.5px] text-bright px-2 py-1.5 outline-none [&>option]:bg-ink [&>option]:text-bright"
            >
              <option value="">Tous</option>
              {auteurs.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          {/* Catégorie */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10.5px] font-mono text-mute uppercase tracking-wider">Catégorie</label>
            <select
              value={idCategorie}
              onChange={e => updateParam('cat', e.target.value)}
              className="hair bg-transparent text-[12.5px] text-bright px-2 py-1.5 outline-none [&>option]:bg-ink [&>option]:text-bright"
            >
              <option value="">Toutes</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nom}</option>
              ))}
            </select>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10.5px] font-mono text-mute uppercase tracking-wider">Tags</label>
              <div className="flex flex-wrap gap-1.5">
                {tags.map(tag => {
                  const isActive = idTags.includes(tag.id)
                  return (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      className={`px-2 py-1 hair text-[11px] font-mono transition-colors ${
                        isActive
                          ? 'bg-bright text-ink'
                          : 'text-soft hover:text-bright hover:bg-elev'
                      }`}
                    >
                      {tag.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10.5px] font-mono text-mute uppercase tracking-wider">Période</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateDebut}
                onChange={e => updateParam('date_debut', e.target.value)}
                className="hair bg-transparent text-[12px] text-bright px-2 py-1.5 outline-none flex-1 [color-scheme:dark]"
              />
              <span className="text-mute text-[11px]">→</span>
              <input
                type="date"
                value={dateFin}
                onChange={e => updateParam('date_fin', e.target.value)}
                className="hair bg-transparent text-[12px] text-bright px-2 py-1.5 outline-none flex-1 [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Actions */}
          {activeCount > 0 && (
            <button
              onClick={resetFilters}
              className="text-[11px] font-mono text-mute hover:text-bright transition-colors text-left"
            >
              Réinitialiser ({activeCount})
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchFilters
