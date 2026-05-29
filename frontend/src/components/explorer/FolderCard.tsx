import { useState } from "react"
import type { Categorie } from "../../types"
import { setDndPayload, getDndPayload, isDndDragging, type DndPayload } from "../../lib/dnd"

type Props = {
  categorie: Categorie
  nbSousDossiers: number
  onOpen: () => void
  onDrop?: (payload: DndPayload, targetId: number) => void
}

// Carte dossier (vue grille) : icône, nom, méta (count + sous-dossiers ou badge privé), drag & drop.
function FolderCard({ categorie, nbSousDossiers, onOpen, onDrop }: Props) {
  const [dragOver, setDragOver] = useState(false)
  const priv = categorie.privee

  const handleDragOver = (e: React.DragEvent) => {
    if (!isDndDragging(e)) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (!dragOver) setDragOver(true)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const payload = getDndPayload(e)
    if (!payload || !onDrop) return
    if (payload.kind === 'folder' && payload.id === categorie.id) return
    onDrop(payload, categorie.id)
  }

  return (
    <div
      onClick={onOpen}
      draggable
      onDragStart={(e) => setDndPayload(e, { kind: 'folder', id: categorie.id })}
      onDragOver={handleDragOver}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`group relative bg-panel p-4 cursor-pointer transition-colors ${
        dragOver ? 'border border-dashed border-type-ai bg-type-ai/[0.06]' : 'hair hover:bg-elev hover:!border-line2'
      }`}
    >
      <div className="mb-[18px]">
        <span className="material-symbols-outlined text-[30px]" style={{ color: priv ? 'var(--mute)' : 'var(--type-md)' }}>
          {priv ? 'folder_special' : 'folder'}
        </span>
      </div>
      <div className="font-display font-semibold text-[14px] text-bright truncate">{categorie.nom}</div>
      <div className="text-[11.5px] text-mute mt-0.5 flex items-center gap-1.5 min-w-0">
        {priv ? (
          <>
            <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-warn border-[0.5px] border-warn/35 px-1.5 py-px shrink-0">
              <span className="material-symbols-outlined text-[11px]">lock</span> Privé
            </span>
            <span className="truncate">Slavy l'ignore</span>
          </>
        ) : (
          <span className="truncate">
            {categorie.count} document{categorie.count > 1 ? 's' : ''}
            {nbSousDossiers > 0 ? ` · ${nbSousDossiers} sous-dossier${nbSousDossiers > 1 ? 's' : ''}` : ''}
          </span>
        )}
      </div>
      {dragOver && (
        <div className="absolute inset-0 flex items-center justify-center font-mono text-[10px] uppercase tracking-wider text-type-ai bg-type-ai/[0.04] pointer-events-none">
          Déposer ici
        </div>
      )}
    </div>
  )
}

export default FolderCard
