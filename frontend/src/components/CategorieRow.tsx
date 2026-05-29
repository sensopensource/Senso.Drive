import { useState, type KeyboardEvent } from "react"
import type { Categorie } from "../types"
import { setDndPayload, getDndPayload, isDndDragging } from "../lib/dnd"
import ItemMenu from "./ItemMenu"
import SelectableIcon from "./explorer/SelectableIcon"
import type { FolderActions } from "./explorer/actions"

type Props = {
  categorie: Categorie
  index: number
  checked: boolean
  onToggle: () => void
  onClick: () => void
  actions: FolderActions
  onDrop?: (payload: { kind: 'doc' | 'folder'; id: number }, targetCategorieId: number) => void
}

function CategorieRow({ categorie, index, checked, onToggle, onClick, actions, onDrop }: Props) {
  const baseRowClass = index % 2 === 0 ? "row" : "row-alt"
  const [isDragOver, setIsDragOver] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [nomEdit, setNomEdit] = useState(categorie.nom)
  const priv = categorie.privee

  const handleDragOver = (e: React.DragEvent) => {
    if (!isDndDragging(e) || renaming) return
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

  const startRename = () => { setNomEdit(categorie.nom); setRenaming(true) }
  const submitRename = () => {
    const v = nomEdit.trim()
    setRenaming(false)
    if (v && v !== categorie.nom) actions.rename(categorie.id, v)
  }
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter') submitRename()
    if (e.key === 'Escape') setRenaming(false)
  }

  return (
    <div
      onClick={renaming ? undefined : onClick}
      draggable={!renaming}
      onDragStart={(e) => setDndPayload(e, { kind: 'folder', id: categorie.id })}
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={`group ${baseRowClass} flex items-center px-6 h-[44px] hair-b cursor-pointer transition-colors ${
        isDragOver ? '!bg-elev outline outline-1 outline-type-ai -outline-offset-1' : ''
      } ${checked ? 'bg-type-ai/[0.06] shadow-[inset_2px_0_0_var(--type-ai)]' : ''}`}
    >
      <div className="flex-1 min-w-0 flex items-center gap-2.5">
        <SelectableIcon checked={checked} onToggle={onToggle}>
          <span className="material-symbols-outlined text-[18px]" style={{ color: priv ? 'var(--mute)' : 'var(--type-md)' }}>
            {priv ? 'folder_special' : 'folder'}
          </span>
        </SelectableIcon>
        {renaming ? (
          <input
            autoFocus
            value={nomEdit}
            onChange={(e) => setNomEdit(e.target.value)}
            onKeyDown={onKey}
            onBlur={submitRename}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 bg-ink hair !border-type-ai text-bright text-[13px] px-2 py-1 outline-none"
          />
        ) : (
          <>
            <span className="text-[13px] text-bright font-medium truncate">{categorie.nom}</span>
            {priv && (
              <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-warn border-[0.5px] border-warn/35 px-1.5 py-px shrink-0">
                <span className="material-symbols-outlined text-[11px]">lock</span> Privé
              </span>
            )}
          </>
        )}
      </div>
      <div className="w-[130px] hidden md:block font-mono text-[11px] text-mute">—</div>
      <div className="w-[90px] text-right font-mono text-[11px] text-mute">
        {categorie.count} doc{categorie.count > 1 ? 's' : ''}
      </div>
      <div className="w-7 flex justify-end">
        <ItemMenu
          className="opacity-0 group-hover:opacity-100"
          actions={[
            { label: 'Renommer', icon: 'drive_file_rename_outline', onClick: startRename },
            { label: priv ? 'Rendre public' : 'Rendre privé', icon: priv ? 'lock_open' : 'lock', onClick: () => actions.togglePrivee(categorie) },
            { label: 'Supprimer', icon: 'delete', danger: true, onClick: () => actions.remove(categorie.id) },
          ]}
        />
      </div>
    </div>
  )
}

export default CategorieRow
