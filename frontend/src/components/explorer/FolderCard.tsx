import { useState, type KeyboardEvent } from "react"
import type { Categorie } from "../../types"
import { setDndPayload, getDndPayload, isDndDragging, type DndPayload } from "../../lib/dnd"
import ItemMenu from "../ItemMenu"
import SelectableIcon from "./SelectableIcon"
import type { FolderActions } from "./actions"

type Props = {
  categorie: Categorie
  nbSousDossiers: number
  checked: boolean
  onToggle: () => void
  onOpen: () => void
  actions: FolderActions
  onDrop?: (payload: DndPayload, targetId: number) => void
}

// Carte dossier (vue grille) : icône, nom, méta (count + sous-dossiers ou badge privé), kebab, drag & drop.
function FolderCard({ categorie, nbSousDossiers, checked, onToggle, onOpen, actions, onDrop }: Props) {
  const [dragOver, setDragOver] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [nomEdit, setNomEdit] = useState(categorie.nom)
  const priv = categorie.privee

  const handleDragOver = (e: React.DragEvent) => {
    if (!isDndDragging(e) || renaming) return
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
      onClick={renaming ? undefined : onOpen}
      draggable={!renaming}
      onDragStart={(e) => setDndPayload(e, { kind: 'folder', id: categorie.id })}
      onDragOver={handleDragOver}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`group relative bg-panel p-4 cursor-pointer transition-colors ${
        dragOver ? 'border border-dashed border-type-ai bg-type-ai/[0.06]' : 'hair hover:bg-elev hover:!border-line2'
      } ${checked && !dragOver ? '!border-type-ai bg-type-ai/[0.06]' : ''}`}
    >
      <div className="flex items-start justify-between mb-[18px]">
        <SelectableIcon checked={checked} onToggle={onToggle} size={30}>
          <span className="material-symbols-outlined text-[30px]" style={{ color: priv ? 'var(--mute)' : 'var(--type-md)' }}>
            {priv ? 'folder_special' : 'folder'}
          </span>
        </SelectableIcon>
        <ItemMenu
          className="opacity-0 group-hover:opacity-100"
          actions={[
            { label: 'Renommer', icon: 'drive_file_rename_outline', onClick: startRename },
            { label: priv ? 'Rendre public' : 'Rendre privé', icon: priv ? 'lock_open' : 'lock', onClick: () => actions.togglePrivee(categorie) },
            { label: 'Supprimer', icon: 'delete', danger: true, onClick: () => actions.remove(categorie.id) },
          ]}
        />
      </div>

      {renaming ? (
        <input
          autoFocus
          value={nomEdit}
          onChange={(e) => setNomEdit(e.target.value)}
          onKeyDown={onKey}
          onBlur={submitRename}
          onClick={(e) => e.stopPropagation()}
          className="w-full bg-ink hair !border-type-ai text-bright text-[14px] font-display font-semibold px-2 py-1 outline-none"
        />
      ) : (
        <div className="font-display font-semibold text-[14px] text-bright truncate">{categorie.nom}</div>
      )}

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
