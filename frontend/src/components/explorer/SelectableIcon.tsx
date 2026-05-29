import type { ReactNode } from "react"

type Props = {
  checked: boolean
  onToggle: () => void
  size?: number
  children: ReactNode
}

// Affiche l'icône du fichier/dossier, et la remplace par une case à cocher
// au survol (group-hover du parent) ou quand l'élément est sélectionné.
// Le clic sur la case (dé)sélectionne SANS déclencher l'ouverture de la ligne/carte.
function SelectableIcon({ checked, onToggle, size = 18, children }: Props) {
  return (
    <span
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <span
        className={`absolute inset-0 flex items-center justify-center transition-opacity ${
          checked ? 'opacity-0' : 'group-hover:opacity-0'
        }`}
      >
        {children}
      </span>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onToggle() }}
        aria-label={checked ? 'Désélectionner' : 'Sélectionner'}
        className={`absolute inset-0 flex items-center justify-center transition-opacity ${
          checked ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: size, color: checked ? 'var(--type-ai)' : 'var(--mute)' }}
        >
          {checked ? 'check_box' : 'check_box_outline_blank'}
        </span>
      </button>
    </span>
  )
}

export default SelectableIcon
