import { useState, useEffect, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable"
import AppShell from "../components/AppShell"
import KpiRibbon from "../components/admin/KpiRibbon"
import SortableWidget from "../components/admin/SortableWidget"
import { REGISTRE, ORDRE_DEFAUT, TOUTES_LES_CLES, estWidgetKey, type WidgetKey } from "../components/admin/widgetRegistry"
import { useDashboardLayout, useSaveDashboardLayout } from "../hooks/useDashboardLayout"

// 24h/7j/30j/tout → jours (null = tout l'historique)
const RANGES: { cle: string; label: string; jours: number | null }[] = [
  { cle: '24h',  label: '24h',  jours: 1 },
  { cle: '7j',   label: '7j',   jours: 7 },
  { cle: '30j',  label: '30j',  jours: 30 },
  { cle: 'tout', label: 'tout', jours: null },
]

function AdminDashboardPage() {
  const [rangeCle, setRangeCle] = useState('7j')
  const [editMode, setEditMode] = useState(false)
  const queryClient = useQueryClient()

  const { layout, isLoading: layoutLoading } = useDashboardLayout()
  const { saveLayout } = useSaveDashboardLayout()

  // Disposition locale : ordre des widgets affiches + masques + largeur par widget.
  const [order, setOrder] = useState<WidgetKey[]>(ORDRE_DEFAUT)
  const [hidden, setHidden] = useState<WidgetKey[]>([])
  const [spans, setSpans] = useState<Record<string, number>>({})
  const initialise = useRef(false)

  // Initialisation une seule fois depuis le layout sauve, en fusionnant avec le
  // registre courant (un widget ajoute au code apparait, un widget retire disparait).
  useEffect(() => {
    if (initialise.current || layoutLoading) return
    initialise.current = true
    if (!layout) return

    const ordreSauve = (layout.order ?? []).filter(estWidgetKey)
    const masquesSauves = (layout.hidden ?? []).filter(estWidgetKey)
    const connus = new Set<string>([...ordreSauve, ...masquesSauves])
    const manquants = TOUTES_LES_CLES.filter(c => !connus.has(c))
    setOrder([...ordreSauve, ...manquants])
    setHidden(masquesSauves)
    if (layout.spans) setSpans(layout.spans)
  }, [layout, layoutLoading])

  // Largeur courante d'un widget : valeur sauvee sinon defaut du registre.
  const colsDe = (cle: WidgetKey) => spans[cle] ?? REGISTRE[cle].defaultSpan

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const range = RANGES.find(r => r.cle === rangeCle) ?? RANGES[1]
  const ctx = { jours: range.jours, rangeLabel: range.label }

  const persister = (
    nouvelOrdre: WidgetKey[],
    nouveauHidden: WidgetKey[],
    nouveauxSpans: Record<string, number>,
  ) => {
    saveLayout({ order: nouvelOrdre, hidden: nouveauHidden, spans: nouveauxSpans })
  }

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const from = order.indexOf(active.id as WidgetKey)
    const to = order.indexOf(over.id as WidgetKey)
    if (from === -1 || to === -1) return
    const nouvelOrdre = arrayMove(order, from, to)
    setOrder(nouvelOrdre)
    persister(nouvelOrdre, hidden, spans)
  }

  const masquer = (cle: WidgetKey) => {
    const nouvelOrdre = order.filter(c => c !== cle)
    const nouveauHidden = [...hidden, cle]
    setOrder(nouvelOrdre)
    setHidden(nouveauHidden)
    persister(nouvelOrdre, nouveauHidden, spans)
  }

  const afficher = (cle: WidgetKey) => {
    const nouvelOrdre = [...order, cle]
    const nouveauHidden = hidden.filter(c => c !== cle)
    setOrder(nouvelOrdre)
    setHidden(nouveauHidden)
    persister(nouvelOrdre, nouveauHidden, spans)
  }

  const redimensionner = (cle: WidgetKey, cols: number) => {
    const nouveauxSpans = { ...spans, [cle]: cols }
    setSpans(nouveauxSpans)
    persister(order, hidden, nouveauxSpans)
  }

  const reinitialiser = () => {
    setOrder(ORDRE_DEFAUT)
    setHidden([])
    setSpans({})
    persister(ORDRE_DEFAUT, [], {})
  }

  const rafraichir = () => {
    queryClient.invalidateQueries({ queryKey: ['admin'] })
  }

  return (
    <AppShell>
    <div className="flex-1 flex flex-col min-h-0">

      {/* Sous-barre */}
      <div className="h-14 shrink-0 hair-b flex items-center px-6 gap-4">
        <div className="font-mono text-[11px] text-mute">admin · <b className="text-bright font-medium">vue d'ensemble</b></div>

        <div className="ml-auto flex hair">
          {RANGES.map(r => (
            <button
              key={r.cle}
              type="button"
              onClick={() => setRangeCle(r.cle)}
              className={`px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-wider hair-r last:border-r-0 transition-colors ${
                rangeCle === r.cle ? 'text-bright bg-elev' : 'text-soft hover:text-bright hover:bg-elev'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {editMode && (
          <button
            onClick={reinitialiser}
            className="btn-ghost inline-flex items-center gap-1.5"
            title="Remettre la disposition par défaut"
          >
            <span className="material-symbols-outlined text-[14px] leading-none">restart_alt</span>
            Remettre par défaut
          </button>
        )}

        <button
          onClick={() => setEditMode(e => !e)}
          className={`btn-ghost inline-flex items-center gap-1.5 ${editMode ? '!text-type-md !border-type-md' : ''}`}
          title="Personnaliser la disposition"
        >
          <span className="material-symbols-outlined text-[14px] leading-none">{editMode ? 'check' : 'tune'}</span>
          {editMode ? 'Terminer' : 'Personnaliser'}
        </button>

        <button onClick={rafraichir} className="btn-ghost inline-flex items-center" title="Rafraîchir">
          <span className="material-symbols-outlined text-[14px] leading-none">refresh</span>
        </button>
      </div>

      {/* Contenu scrollable */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <KpiRibbon jours={range.jours} rangeLabel={range.label} />

        {layoutLoading ? (
          <div className="font-mono text-[11px] text-mute py-8">Chargement de la disposition…</div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <div className="grid grid-cols-12 grid-flow-row-dense gap-4">
              <SortableContext items={order} strategy={rectSortingStrategy}>
                {order.map(cle => (
                  <SortableWidget
                    key={cle}
                    id={cle}
                    cols={colsDe(cle)}
                    minCols={REGISTRE[cle].minSpan}
                    editMode={editMode}
                    onHide={() => masquer(cle)}
                    onResize={(cols) => redimensionner(cle, cols)}
                  >
                    {REGISTRE[cle].render(ctx)}
                  </SortableWidget>
                ))}
              </SortableContext>

              {editMode && (
                <AddWidgetZone hidden={hidden} onAdd={afficher} />
              )}
            </div>
          </DndContext>
        )}
      </div>
    </div>
    </AppShell>
  )
}

// Zone "ajouter un widget" : visible en mode edition, liste les widgets masques.
function AddWidgetZone({ hidden, onAdd }: { hidden: WidgetKey[]; onAdd: (cle: WidgetKey) => void }) {
  return (
    <div className="col-span-12 hair border-dashed flex flex-wrap items-center gap-2 px-4 py-4 min-h-[80px]">
      <span className="font-mono text-[10px] uppercase tracking-wider text-mute mr-2 flex items-center gap-1.5">
        <span className="material-symbols-outlined text-[14px]">add</span>
        Ajouter un widget
      </span>
      {hidden.length === 0 ? (
        <span className="font-mono text-[10.5px] text-mute italic">tous les widgets sont affichés</span>
      ) : (
        hidden.map(cle => (
          <button
            key={cle}
            type="button"
            onClick={() => onAdd(cle)}
            className="flex items-center gap-1.5 px-2.5 py-1 hair text-[11.5px] text-soft hover:text-bright hover:bg-elev transition-colors"
          >
            <span className="material-symbols-outlined text-[13px]">add</span>
            {REGISTRE[cle].label}
          </button>
        ))
      )}
    </div>
  )
}

export default AdminDashboardPage
