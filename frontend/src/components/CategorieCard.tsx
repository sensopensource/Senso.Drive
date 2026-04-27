import { useState, type ChangeEvent } from "react"
import type { Categorie } from "../types"

type Props = {
  categorie: Categorie
  onUpdate: (updated: Categorie) => void
}

function CategorieCard({ categorie, onUpdate }: Props) {
  const [editMode, setEditMode] = useState(false)
  const [nomEdit, setNomEdit] = useState(categorie.nom)

  const handleCancel = () => {
    setNomEdit(categorie.nom)
    setEditMode(false)
  }

  const handleValidate = () => {
    if (!nomEdit.trim()) return
    onUpdate({ ...categorie, nom: nomEdit.trim() })
    setEditMode(false)
  }

  return (
    <li className="flex items-center justify-between px-4 py-3 hover:bg-surface-2 transition-colors">

      {editMode ? (
        <>
          {/* Mode édition : input + actions */}
          <input
            type="text"
            value={nomEdit}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setNomEdit(e.target.value)}
            autoFocus
            className="flex-1 bg-base border border-border text-fg-1 px-2 py-1 text-sm font-body focus:outline-none focus:border-primary mr-3"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleValidate}
              className="flex items-center gap-1 font-mono text-xs uppercase tracking-wider text-fg-1 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-base">check</span>
              Valider
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-1 font-mono text-xs uppercase tracking-wider text-fg-3 hover:text-fg-1 transition-colors"
            >
              <span className="material-symbols-outlined text-base">close</span>
              Annuler
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Mode affichage : nom + bouton modifier */}
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-fg-3 text-base">label</span>
            <span className="font-body text-sm text-fg-1">{categorie.nom}</span>
          </div>
          <button
            onClick={() => setEditMode(true)}
            className="flex items-center gap-1 font-mono text-xs uppercase tracking-wider text-fg-3 hover:text-fg-1 transition-colors"
          >
            <span className="material-symbols-outlined text-base">edit</span>
            Modifier
          </button>
        </>
      )}

    </li>
  )
}

export default CategorieCard
