import { useState, type KeyboardEvent } from "react"
import type { Document } from "../../types"
import { setDndPayload } from "../../lib/dnd"
import { formatDateCourte, formatOctets } from "../../lib/format"
import ItemMenu from "../ItemMenu"
import DocThumb from "./DocThumb"
import type { DocActions } from "./actions"

type Props = {
  document: Document
  selected: boolean
  checked: boolean
  onToggle: () => void
  onOpen: () => void
  actions: DocActions
}

// Carte document (vue grille) = vignette (DocThumb) + corps (nom, méta, kebab).
function DocCard({ document, selected, checked, onToggle, onOpen, actions }: Props) {
  const [renaming, setRenaming] = useState(false)
  const [nomEdit, setNomEdit] = useState(document.titre)

  const startRename = () => { setNomEdit(document.titre); setRenaming(true) }
  const submitRename = () => {
    const v = nomEdit.trim()
    setRenaming(false)
    if (v && v !== document.titre) actions.rename(document.id, v)
  }
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter') submitRename()
    if (e.key === 'Escape') setRenaming(false)
  }

  return (
    <div
      onClick={renaming ? undefined : onOpen}
      draggable={!renaming}
      onDragStart={(e) => setDndPayload(e, { kind: 'doc', id: document.id })}
      className={`group bg-panel flex flex-col overflow-hidden cursor-pointer transition-colors hover:!border-line2 ${selected ? 'hair !border-type-ai' : 'hair'} ${checked ? '!border-type-ai' : ''}`}
    >
      <DocThumb document={document} checked={checked} onToggle={onToggle} />

      <div className="px-[13px] py-[11px] flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {renaming ? (
            <input
              autoFocus
              value={nomEdit}
              onChange={(e) => setNomEdit(e.target.value)}
              onKeyDown={onKey}
              onBlur={submitRename}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-ink hair !border-type-ai text-bright text-[12.5px] px-2 py-1 outline-none"
            />
          ) : (
            <div className="text-[12.5px] text-bright truncate">{document.titre}</div>
          )}
          <div className="font-mono text-[10.5px] text-mute mt-1">
            {formatDateCourte(document.date_creation)}{document.taille_octets != null ? ` · ${formatOctets(document.taille_octets)}` : ''}
          </div>
        </div>
        <ItemMenu
          className="opacity-0 group-hover:opacity-100 shrink-0"
          actions={[
            { label: 'Aperçu', icon: 'visibility', onClick: onOpen },
            { label: 'Renommer', icon: 'drive_file_rename_outline', onClick: startRename },
            { label: 'Télécharger', icon: 'download', onClick: () => actions.download(document) },
            { label: 'Supprimer', icon: 'delete', danger: true, onClick: () => actions.remove(document.id) },
          ]}
        />
      </div>
    </div>
  )
}

export default DocCard
