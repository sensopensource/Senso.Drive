import { type ReactNode } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { LARGEURS, spanClass } from "./widgetRegistry"

type Props = {
  id: string
  cols: number              // largeur courante (colonnes sur 12)
  minCols: number           // largeur minimale autorisee
  editMode: boolean
  onHide: () => void
  onResize: (cols: number) => void
  children: ReactNode
}

// Enrobe un widget pour le rendre triable + redimensionnable (largeur).
// La barre d'edition n'apparait qu'en mode edition ; sinon le drag est off.
function SortableWidget({ id, cols, minCols, editMode, onHide, onResize, children }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: !editMode,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative ${spanClass(cols)} ${isDragging ? 'opacity-50 z-20' : ''} ${editMode ? 'ring-1 ring-line2' : ''}`}
    >
      {editMode && (
        <div className="absolute top-1.5 right-1.5 z-10 flex flex-wrap items-center justify-end gap-1 bg-elev hair px-1 py-0.5 max-w-[calc(100%-12px)]">
          {/* Selecteur de largeur */}
          <div className="flex">
            {LARGEURS.map(l => {
              const disabled = l.cols < minCols
              const actif = l.cols === cols
              return (
                <button
                  key={l.cols}
                  type="button"
                  disabled={disabled}
                  onClick={() => onResize(l.cols)}
                  className={`w-5 h-5 flex items-center justify-center text-[11px] transition-colors ${
                    actif ? 'text-bright bg-panel'
                    : disabled ? 'text-mute/40 cursor-not-allowed'
                    : 'text-mute hover:text-bright'
                  }`}
                  title={disabled ? 'Trop étroit pour ce widget' : `Largeur ${l.label}`}
                >
                  {l.label}
                </button>
              )
            })}
          </div>

          <span className="w-px h-4 bg-line2 mx-0.5" />

          <button
            {...attributes}
            {...listeners}
            className="w-5 h-5 flex items-center justify-center text-mute hover:text-bright cursor-grab active:cursor-grabbing"
            title="Déplacer"
            aria-label="Déplacer le widget"
          >
            <span className="material-symbols-outlined text-[14px] leading-none">drag_indicator</span>
          </button>
          <button
            type="button"
            onClick={onHide}
            className="w-5 h-5 flex items-center justify-center text-mute hover:text-danger"
            title="Masquer"
            aria-label="Masquer le widget"
          >
            <span className="material-symbols-outlined text-[14px] leading-none">close</span>
          </button>
        </div>
      )}
      {children}
    </div>
  )
}

export default SortableWidget
