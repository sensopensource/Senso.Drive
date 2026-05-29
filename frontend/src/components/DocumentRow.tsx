import { useState, type KeyboardEvent } from "react"
import type { Document } from "../types"
import { setDndPayload } from "../lib/dnd"
import { formatOctets, formatDateCourte } from "../lib/format"
import TypeIcon from "./TypeIcon"
import ItemMenu from "./ItemMenu"
import SelectableIcon from "./explorer/SelectableIcon"
import type { DocActions } from "./explorer/actions"

type Props = {
  document: Document
  index: number
  isSelected: boolean
  checked: boolean
  onToggle: () => void
  onClick: () => void
  actions: DocActions
  extrait?: string | null
}

function DocumentRow({ document, index, isSelected, checked, onToggle, onClick, actions, extrait }: Props) {
  const baseRowClass = index % 2 === 0 ? "row" : "row-alt"
  const selectedClass = isSelected ? "row-selected" : ""
  const enAnalyse = document.etat === 'a_analyser'
  const echec = document.etat === 'echec'

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
      onClick={renaming ? undefined : onClick}
      draggable={!renaming}
      onDragStart={(e) => setDndPayload(e, { kind: 'doc', id: document.id })}
      className={`group ${baseRowClass} ${selectedClass} ${checked ? 'bg-type-ai/[0.06] shadow-[inset_2px_0_0_var(--type-ai)]' : ''} flex items-center px-6 h-[44px] hair-b cursor-pointer transition-colors`}
    >
      <div className="flex-1 min-w-0 flex items-center gap-2.5">
        <SelectableIcon checked={checked} onToggle={onToggle}>
          <TypeIcon type={document.type_fichier} />
        </SelectableIcon>
        <div className="min-w-0 flex-1">
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
            <>
              <div className="text-[13px] text-bright truncate">{document.titre}</div>
              {extrait && (
                <div className="text-[11px] text-mute truncate [&>b]:text-soft [&>b]:font-semibold" dangerouslySetInnerHTML={{ __html: extrait }} />
              )}
            </>
          )}
        </div>
      </div>
      <div className="w-[130px] hidden md:block font-mono text-[11px] text-mute">
        {enAnalyse ? (
          <span className="text-type-img">analyse en cours</span>
        ) : echec ? (
          <span className="text-danger">échec d'analyse</span>
        ) : (
          formatDateCourte(document.date_creation)
        )}
      </div>
      <div className="w-[90px] text-right font-mono text-[11px] text-mute">
        {document.taille_octets != null ? formatOctets(document.taille_octets) : '—'}
      </div>
      <div className="w-7 flex justify-end">
        <ItemMenu
          className="opacity-0 group-hover:opacity-100"
          actions={[
            { label: 'Aperçu', icon: 'visibility', onClick },
            { label: 'Renommer', icon: 'drive_file_rename_outline', onClick: startRename },
            { label: 'Télécharger', icon: 'download', onClick: () => actions.download(document) },
            { label: 'Supprimer', icon: 'delete', danger: true, onClick: () => actions.remove(document.id) },
          ]}
        />
      </div>
    </div>
  )
}

export default DocumentRow
