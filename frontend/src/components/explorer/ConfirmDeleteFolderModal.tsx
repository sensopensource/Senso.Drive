import { useEffect } from "react"
import type { Categorie } from "../../types"

type Props = {
  categorie: Categorie
  categories: Categorie[]
  onClose: () => void
  onConfirm: () => void
}

// Confirmation de suppression d'un dossier (kebab liste/grille).
// Avertit si le dossier n'est pas vide : docs -> corbeille, sous-dossiers supprimés définitivement.
function ConfirmDeleteFolderModal({ categorie, categories, onClose, onConfirm }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const nbDocs = categorie.count
  const nbSousDossiers = categories.filter(c => c.id_parent === categorie.id).length
  const nonVide = nbDocs > 0 || nbSousDossiers > 0

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()} className="w-[440px] bg-panel hair flex flex-col">
        <div className="px-5 py-3 hair-b flex items-center justify-between">
          <div className="section-label">Supprimer le dossier</div>
          <button onClick={onClose} className="text-mute hover:text-bright transition-colors" aria-label="Fermer">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>

        <div className="p-5 flex flex-col gap-3">
          <p className="text-[13px] text-soft">
            Supprimer le dossier « <span className="text-bright">{categorie.nom}</span> » ?
          </p>
          {nonVide && (
            <div className="flex items-start gap-2 text-[12px] text-warn bg-warn/[0.07] hair !border-warn/30 px-3 py-2.5 leading-snug">
              <span className="material-symbols-outlined text-[15px] shrink-0 mt-px">warning</span>
              <span>
                Ce dossier contient {nbDocs > 0 && `${nbDocs} document${nbDocs > 1 ? 's' : ''}`}
                {nbDocs > 0 && nbSousDossiers > 0 && ' et '}
                {nbSousDossiers > 0 && `${nbSousDossiers} sous-dossier${nbSousDossiers > 1 ? 's' : ''}`}.
                {' '}Les documents iront à la corbeille, les sous-dossiers seront supprimés définitivement.
              </span>
            </div>
          )}
          <div className="flex items-center justify-end gap-2 mt-1">
            <button type="button" onClick={onClose} className="btn-ghost">Annuler</button>
            <button
              type="button"
              onClick={() => { onConfirm(); onClose() }}
              className="btn-primary !bg-danger !text-bright"
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDeleteFolderModal
