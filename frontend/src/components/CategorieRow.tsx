import { useState } from "react"
import type { Categorie } from "../types"
import { setDndPayload, getDndPayload, isDndDragging } from "../lib/dnd"

type Props = {
  categorie: Categorie
  index: number
  onClick: () => void
  onDrop?: (payload: { kind: 'doc' | 'folder'; id: number }, targetCategorieId: number) => void
}

function CategorieRow({ categorie, index, onClick, onDrop }: Props) {
  const baseRowClass = index % 2 === 0 ? "row" : "row-alt"
  const [isDragOver, setIsDragOver] = useState(false)
  const priv = categorie.privee

  const handleDragOver = (e: React.DragEvent) => {
    if (!isDndDragging(e)) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (!isDragOver) setIsDragOver(true)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const payload = getDndPayload(e)
    if (!payload || !onDrop) return
    if (payload.kind === 'folder' && payload.id === categorie.id) return
    onDrop(payload, categorie.id)
  }

  return (
    <div
      onClick={onClick}
      draggable
      onDragStart={(e) => setDndPayload(e, { kind: 'folder', id: categorie.id })}
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={`${baseRowClass} flex items-center px-6 h-[44px] hair-b cursor-pointer transition-colors ${
        isDragOver ? '!bg-elev outline outline-1 outline-type-ai -outline-offset-1' : ''
      }`}
    >
      <div className="flex-1 min-w-0 flex items-center gap-2.5">
        <span className="material-symbols-outlined text-[18px]" style={{ color: priv ? 'var(--mute)' : 'var(--type-md)' }}>
          {priv ? 'folder_special' : 'folder'}
        </span>
        <span className="text-[13px] text-bright font-medium truncate">{categorie.nom}</span>
        {priv && (
          <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-warn border-[0.5px] border-warn/35 px-1.5 py-px shrink-0">
            <span className="material-symbols-outlined text-[11px]">lock</span> Privé
          </span>
        )}
      </div>
      <div className="w-[130px] hidden md:block font-mono text-[11px] text-mute">—</div>
      <div className="w-[90px] text-right font-mono text-[11px] text-mute">
        {categorie.count} doc{categorie.count > 1 ? 's' : ''}
      </div>
    </div>
  )
}

export default CategorieRow
