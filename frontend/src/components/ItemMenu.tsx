import { useState, useRef, useEffect } from "react"

export type MenuAction = {
  label: string
  icon: string
  onClick: () => void
  danger?: boolean
}

type Props = {
  actions: MenuAction[]
  // classe du bouton kebab (pour gérer l'opacité au hover selon le conteneur)
  className?: string
}

// Menu kebab (⋮) partagé : liste d'actions, fermeture au clic extérieur.
// Stoppe la propagation pour ne pas déclencher l'ouverture de la ligne/carte sous-jacente.
function ItemMenu({ actions, className = "" }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`flex items-center justify-center text-mute hover:text-bright transition-colors ${className}`}
        aria-label="Actions"
      >
        <span className="material-symbols-outlined text-[17px]">more_vert</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-40 min-w-[180px] bg-elev hair shadow-[0_10px_28px_rgba(0,0,0,.55)] py-1">
          {actions.map((a, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { setOpen(false); a.onClick() }}
              className={`flex items-center gap-2.5 w-full px-3 py-2 text-left text-[12.5px] transition-colors hover:bg-panel ${
                a.danger ? 'text-danger hover:!text-danger' : 'text-soft hover:text-bright'
              }`}
            >
              <span className={`material-symbols-outlined text-[16px] ${a.danger ? 'text-danger' : 'text-mute'}`}>{a.icon}</span>
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default ItemMenu
