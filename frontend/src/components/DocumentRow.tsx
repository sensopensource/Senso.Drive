import type { Document } from "../types"
import { setDndPayload } from "../lib/dnd"
import { formatOctets, formatDateCourte } from "../lib/format"
import TypeIcon from "./TypeIcon"

type Props = {
  document: Document
  index: number
  isSelected: boolean
  onClick: () => void
  extrait?: string | null
}

function DocumentRow({ document, index, isSelected, onClick, extrait }: Props) {
  const baseRowClass = index % 2 === 0 ? "row" : "row-alt"
  const selectedClass = isSelected ? "row-selected" : ""
  const enAnalyse = document.etat === 'a_analyser'
  const echec = document.etat === 'echec'

  return (
    <div
      onClick={onClick}
      draggable
      onDragStart={(e) => setDndPayload(e, { kind: 'doc', id: document.id })}
      className={`${baseRowClass} ${selectedClass} flex items-center px-6 h-[44px] hair-b cursor-pointer transition-colors`}
    >
      <div className="flex-1 min-w-0 flex items-center gap-2.5">
        <TypeIcon type={document.type_fichier} />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] text-bright truncate">{document.titre}</div>
          {extrait && (
            <div
              className="text-[11px] text-mute truncate [&>b]:text-soft [&>b]:font-semibold"
              dangerouslySetInnerHTML={{ __html: extrait }}
            />
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
    </div>
  )
}

export default DocumentRow
