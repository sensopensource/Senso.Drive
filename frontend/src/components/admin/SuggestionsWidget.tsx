import Widget from "./Widget"
import { useOverview } from "../../hooks/useOverview"
import { LABELS } from "../../lib/labels"

type Props = {
  jours: number | null
  rangeLabel: string
  className?: string
}

const CIRCONFERENCE = 2 * Math.PI * 14  // r=14 dans le viewBox 36x36

function SuggestionsWidget({ jours, rangeLabel, className }: Props) {
  const { overview, isLoading } = useOverview(jours)

  return (
    <Widget
      title={`Suggestions ${LABELS.slavy.nom} — ${rangeLabel}`}
      icon="auto_awesome" iconClass="text-type-ai"
      counter={overview ? `${overview.suggestions_total} émises` : undefined}
      className={className}
    >
      {isLoading || !overview ? (
        <div className="h-24 bg-elev animate-pulse" />
      ) : overview.suggestions_total === 0 ? (
        <div className="h-24 flex items-center justify-center font-mono text-[10.5px] text-mute">
          Aucune suggestion sur la période
        </div>
      ) : (
        <Donut
          validees={overview.suggestions_validees}
          refusees={overview.suggestions_refusees}
          enAttente={overview.suggestions_en_attente}
          total={overview.suggestions_total}
        />
      )}
    </Widget>
  )
}

function Donut({ validees, refusees, enAttente, total }: { validees: number; refusees: number; enAttente: number; total: number }) {
  // Longueurs d'arc proportionnelles, posees bout a bout via stroke-dashoffset negatif.
  const arc = (n: number) => (n / total) * CIRCONFERENCE
  const arcOk = arc(validees)
  const arcKo = arc(refusees)
  const traites = validees + refusees
  const tauxAccept = traites > 0 ? Math.round((validees / traites) * 100) : null

  return (
    <div className="grid grid-cols-[96px_1fr] gap-4 items-center">
      <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
        <circle cx="18" cy="18" r="14" fill="none" stroke="var(--line)" strokeWidth="8" />
        <circle cx="18" cy="18" r="14" fill="none" stroke="var(--success)" strokeWidth="8"
          strokeDasharray={`${arcOk} ${CIRCONFERENCE}`} strokeDashoffset="0" />
        <circle cx="18" cy="18" r="14" fill="none" stroke="var(--danger)" strokeWidth="8"
          strokeDasharray={`${arcKo} ${CIRCONFERENCE}`} strokeDashoffset={-arcOk} />
        <circle cx="18" cy="18" r="14" fill="none" stroke="var(--type-ai)" strokeWidth="8"
          strokeDasharray={`${arc(enAttente)} ${CIRCONFERENCE}`} strokeDashoffset={-(arcOk + arcKo)} />
      </svg>

      <div className="flex flex-col gap-2">
        <Ligne couleur="var(--success)" label="Validées" valeur={validees} />
        <Ligne couleur="var(--danger)" label="Refusées" valeur={refusees} />
        <Ligne couleur="var(--type-ai)" label="En attente" valeur={enAttente} />
        {tauxAccept != null && (
          <div className="grid grid-cols-[8px_1fr_auto] gap-2.5 items-center mt-1.5 pt-2 hair-t">
            <span />
            <span className="text-[12px] text-soft">Taux d'acceptation</span>
            <span className="font-mono text-[11.5px] text-success tabular-nums">{tauxAccept} %</span>
          </div>
        )}
      </div>
    </div>
  )
}

function Ligne({ couleur, label, valeur }: { couleur: string; label: string; valeur: number }) {
  return (
    <div className="grid grid-cols-[8px_1fr_auto] gap-2.5 items-center">
      <span className="w-2 h-2" style={{ background: couleur }} />
      <span className="text-[12px] text-soft">{label}</span>
      <span className="font-mono text-[11.5px] text-bright tabular-nums">{valeur}</span>
    </div>
  )
}

export default SuggestionsWidget
