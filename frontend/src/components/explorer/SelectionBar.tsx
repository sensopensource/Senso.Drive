import { useState } from "react"

type Props = {
  nbDocs: number
  nbFolders: number
  nbDossiersNonVides: number
  onMove: () => void
  onDelete: () => void
  onClear: () => void
  moveDisabled?: boolean
}

// Barre flottante d'actions sur la multi-sélection (docs + dossiers).
// Décalée de 140px (moitié de la sidebar 280px) pour se centrer sur la zone de contenu.
function SelectionBar({ nbDocs, nbFolders, nbDossiersNonVides, onMove, onDelete, onClear, moveDisabled = false }: Props) {
  const [confirming, setConfirming] = useState(false)
  const count = nbDocs + nbFolders

  const detail = (() => {
    if (nbDocs > 0 && nbFolders > 0) return `${nbDocs} doc${nbDocs > 1 ? 's' : ''} · ${nbFolders} dossier${nbFolders > 1 ? 's' : ''}`
    if (nbFolders > 0) return `${nbFolders} dossier${nbFolders > 1 ? 's' : ''}`
    return `${nbDocs} doc${nbDocs > 1 ? 's' : ''}`
  })()

  return (
    <div className="fixed bottom-6 left-[calc(50%+140px)] -translate-x-1/2 z-[60] flex items-center gap-1.5 bg-elev hair shadow-[0_10px_32px_rgba(0,0,0,.6)] pl-4 pr-2 py-1.5">
      {confirming ? (
        <div className="flex flex-col items-center gap-2 py-0.5">
          {nbDossiersNonVides > 0 && (
            <span className="flex items-start gap-1.5 text-[11px] text-warn max-w-[440px] leading-snug">
              <span className="material-symbols-outlined text-[14px] shrink-0 mt-px">warning</span>
              {nbDossiersNonVides} dossier{nbDossiersNonVides > 1 ? 's' : ''} non vide{nbDossiersNonVides > 1 ? 's' : ''} : leurs documents iront à la corbeille et les sous-dossiers seront supprimés définitivement.
            </span>
          )}
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[11px] text-soft mr-2">
              Supprimer {count} élément{count > 1 ? 's' : ''} ?
            </span>
            <button
              onClick={() => setConfirming(false)}
              className="font-mono text-[10px] uppercase tracking-wider text-mute hover:text-bright transition-colors px-2"
            >
              Annuler
            </button>
            <button
              onClick={() => { setConfirming(false); onDelete() }}
              className="inline-flex items-center gap-1.5 text-[12px] text-bright bg-danger px-3 py-1.5 hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-[15px]">delete</span> Confirmer
            </button>
          </div>
        </div>
      ) : (
        <>
          <span className="font-mono text-[11px] text-bright mr-2">
            {count} sélectionné{count > 1 ? 's' : ''} <span className="text-mute">({detail})</span>
          </span>
          <button
            onClick={onMove}
            disabled={moveDisabled}
            className="inline-flex items-center gap-1.5 text-[12px] text-soft hair px-3 py-1.5 hover:text-bright hover:bg-panel transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[15px]">drive_file_move</span> Déplacer vers…
          </button>
          <button
            onClick={() => setConfirming(true)}
            className="inline-flex items-center gap-1.5 text-[12px] text-danger border-[0.5px] border-danger/40 px-3 py-1.5 hover:bg-panel transition-colors"
          >
            <span className="material-symbols-outlined text-[15px]">delete</span> Supprimer
          </button>
          <button
            onClick={onClear}
            aria-label="Annuler la sélection"
            className="w-[30px] h-[30px] flex items-center justify-center text-mute hover:text-bright transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </>
      )}
    </div>
  )
}

export default SelectionBar
