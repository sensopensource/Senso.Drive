import { useState, type KeyboardEvent } from "react"
import type { Document } from "../../types"
import { setDndPayload } from "../../lib/dnd"
import { formatDateCourte, formatOctets } from "../../lib/format"
import TypeIcon from "../TypeIcon"
import ItemMenu from "../ItemMenu"
import SelectableIcon from "./SelectableIcon"
import type { DocActions } from "./actions"

type Props = {
  document: Document
  selected: boolean
  checked: boolean
  onToggle: () => void
  onOpen: () => void
  actions: DocActions
}

// Carte document (vue grille). NB : l'aperçu réel (thumbnail) est différé — cf #6-bis.
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
      className={`group bg-panel p-4 cursor-pointer transition-colors hover:bg-elev hover:!border-line2 ${selected ? 'hair !border-type-ai' : 'hair'} ${checked ? '!bg-type-ai/[0.06] !border-type-ai' : ''}`}
    >
      <div className="flex items-start justify-between mb-[18px]">
        <span className="w-[34px] h-[34px] hair flex items-center justify-center">
          <SelectableIcon checked={checked} onToggle={onToggle} size={20}>
            <TypeIcon type={document.type_fichier} size={20} />
          </SelectableIcon>
        </span>
        <ItemMenu
          className="opacity-0 group-hover:opacity-100"
          actions={[
            { label: 'Aperçu', icon: 'visibility', onClick: onOpen },
            { label: 'Renommer', icon: 'drive_file_rename_outline', onClick: startRename },
            { label: 'Télécharger', icon: 'download', onClick: () => actions.download(document) },
            { label: 'Supprimer', icon: 'delete', danger: true, onClick: () => actions.remove(document.id) },
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
          className="w-full bg-ink hair !border-type-ai text-bright text-[13px] px-2 py-1 outline-none"
        />
      ) : (
        <div className="text-[13px] text-bright truncate">{document.titre}</div>
      )}

      {document.etat === 'a_analyser' ? (
        <div className="font-mono text-[10.5px] text-type-img mt-1">Slavy analyse l'image…</div>
      ) : document.etat === 'echec' ? (
        <div className="font-mono text-[10.5px] text-danger mt-1">Analyse échouée</div>
      ) : (
        <div className="font-mono text-[10.5px] text-mute mt-1">
          {formatDateCourte(document.date_creation)}{document.taille_octets != null ? ` · ${formatOctets(document.taille_octets)}` : ''}
        </div>
      )}
    </div>
  )
}

export default DocCard
