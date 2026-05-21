import { type ReactNode } from "react"
import { useOverview } from "../../hooks/useOverview"
import { formatNombre, formatCompact } from "../../lib/format"

type Props = {
  jours: number | null
  rangeLabel: string
}

type KpiProps = {
  label: string
  icon: string
  iconClass: string
  value: string
  sub: ReactNode
}

function Kpi({ label, icon, iconClass, value, sub }: KpiProps) {
  return (
    <div className="px-4.5 py-4 hair-r last:border-r-0">
      <div className="section-label flex items-center gap-1.5 mb-2">
        <span className={`material-symbols-outlined text-[13px] ${iconClass}`}>{icon}</span>
        {label}
      </div>
      <div className="font-display font-medium text-[28px] leading-none tracking-tight tabular-nums">{value}</div>
      <div className="font-mono text-[10.5px] text-soft mt-1.5">{sub}</div>
    </div>
  )
}

function KpiRibbon({ jours, rangeLabel }: Props) {
  const { overview, isLoading } = useOverview(jours)

  if (isLoading || !overview) {
    return (
      <div className="hair bg-panel mb-4 grid grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-4.5 py-4 hair-r last:border-r-0">
            <div className="h-3 w-16 bg-elev mb-3" />
            <div className="h-7 w-12 bg-elev" />
          </div>
        ))}
      </div>
    )
  }

  const o = overview
  const periodeLabel = jours == null ? 'au total' : `sur ${rangeLabel}`

  return (
    <div className="hair bg-panel mb-4 grid grid-cols-5">
      <Kpi
        label="Utilisateurs" icon="group" iconClass="text-soft"
        value={formatNombre(o.utilisateurs_total)}
        sub={jours == null ? 'au total' : <><span className="text-success">+{o.utilisateurs_delta}</span> {periodeLabel}</>}
      />
      <Kpi
        label="Documents" icon="description" iconClass="text-type-docx"
        value={formatNombre(o.documents_total)}
        sub={jours == null ? 'au total' : <><span className="text-success">+{o.documents_delta}</span> {periodeLabel}</>}
      />
      <Kpi
        label={`Tokens ${rangeLabel}`} icon="memory" iconClass="text-type-ai"
        value={formatCompact(o.tokens_periode)}
        sub={
          o.tokens_delta_pct == null
            ? '—'
            : <><span className={o.tokens_delta_pct >= 0 ? 'text-success' : 'text-danger'}>
                {o.tokens_delta_pct >= 0 ? '+' : ''}{o.tokens_delta_pct.toFixed(0)}%
              </span> vs. -1</>
        }
      />
      <Kpi
        label="Suggestions" icon="auto_awesome" iconClass="text-type-ai"
        value={formatNombre(o.suggestions_total)}
        sub={`${o.suggestions_validees} validées · ${o.suggestions_refusees} refusées`}
      />
      <Kpi
        label="Évènements" icon="terminal" iconClass="text-type-md"
        value={formatNombre(o.evenements_total)}
        sub={
          o.evenements_erreurs_jour > 0
            ? <><span className="text-danger">{o.evenements_erreurs_jour} erreur{o.evenements_erreurs_jour > 1 ? 's' : ''}</span> aujourd'hui</>
            : 'aucune erreur aujourd\'hui'
        }
      />
    </div>
  )
}

export default KpiRibbon
