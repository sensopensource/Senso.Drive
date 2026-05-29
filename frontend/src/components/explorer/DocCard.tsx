import type { Document } from "../../types"
import { setDndPayload } from "../../lib/dnd"
import { formatDateCourte, formatOctets } from "../../lib/format"
import TypeIcon from "../TypeIcon"

type Props = {
  document: Document
  selected: boolean
  onOpen: () => void
}

// Carte document (vue grille). NB : l'aperçu réel (thumbnail) est différé — cf #6-bis.
function DocCard({ document, selected, onOpen }: Props) {
  return (
    <div
      onClick={onOpen}
      draggable
      onDragStart={(e) => setDndPayload(e, { kind: 'doc', id: document.id })}
      className={`group bg-panel p-4 cursor-pointer transition-colors hover:bg-elev hover:!border-line2 ${
        selected ? 'hair !border-type-ai' : 'hair'
      }`}
    >
      <div className="flex items-start justify-between mb-[18px]">
        <span className="w-[34px] h-[34px] hair flex items-center justify-center">
          <TypeIcon type={document.type_fichier} />
        </span>
        <span className="material-symbols-outlined text-[16px] text-mute opacity-0 group-hover:opacity-100 cursor-grab">drag_indicator</span>
      </div>
      <div className="text-[13px] text-bright truncate">{document.titre}</div>
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
