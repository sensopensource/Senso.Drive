import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import AppShell from "../components/AppShell"
import SubBar from "../components/SubBar"
import Widget from "../components/admin/Widget"
import { useAdminSante } from "../hooks/useAdminSante"
import { formatNombre } from "../lib/format"
import type { SanteParSource, SanteIncident } from "../types"

const RANGES: { cle: string; label: string; jours: number | null }[] = [
  { cle: '24h',  label: '24h',  jours: 1 },
  { cle: '7j',   label: '7j',   jours: 7 },
  { cle: '30j',  label: '30j',  jours: 30 },
  { cle: 'tout', label: 'tout', jours: null },
]

const SOURCE_META: Record<string, { label: string; couleur: string }> = {
  resume:     { label: 'Résumés',     couleur: 'var(--type-ai)' },
  suggestion: { label: 'Agent Slavy', couleur: 'var(--type-docx)' },
  vision:     { label: 'Vision',      couleur: 'var(--type-img)' },
}

const ETAT_META: Record<string, { label: string; icone: string; couleur: string; bordure: string }> = {
  vert:   { label: 'Système opérationnel', icone: 'check_circle', couleur: 'text-success',  bordure: 'border-l-success' },
  orange: { label: 'Service dégradé',      icone: 'warning',      couleur: 'text-type-md',  bordure: 'border-l-type-md' },
  rouge:  { label: 'Service en panne',     icone: 'error',        couleur: 'text-danger',   bordure: 'border-l-danger' },
}

function sourceMeta(source: string): { label: string; couleur: string } {
  return SOURCE_META[source] ?? { label: source, couleur: 'var(--soft)' }
}

// 240 ms / 2,6 s / 600 s — base 1000, convention FR.
function formatLatence(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)} ms`
  const secondes = ms / 1000
  const decimales = secondes < 10 ? 1 : 0
  return `${secondes.toLocaleString('fr-FR', { maximumFractionDigits: decimales })} s`
}

function formatPourcent(fraction: number): string {
  return `${(fraction * 100).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`
}

function AdminSantePage() {
  const [rangeCle, setRangeCle] = useState('7j')
  const range = RANGES.find(r => r.cle === rangeCle) ?? RANGES[1]
  const { sante, isLoading } = useAdminSante(range.jours)
  const queryClient = useQueryClient()

  const etat = sante ? (ETAT_META[sante.etat_global] ?? ETAT_META.vert) : ETAT_META.vert

  return (
    <AppShell>
      <div className="flex-1 flex flex-col min-h-0">
        <SubBar>
          <div className="font-mono text-[11px] text-mute">admin · <b className="text-bright font-medium">santé LLM</b></div>
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
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['admin', 'sante'] })}
            className="btn-ghost inline-flex items-center"
            title="Rafraîchir"
          >
            <span className="material-symbols-outlined text-[14px] leading-none">refresh</span>
          </button>
        </SubBar>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isLoading || !sante ? (
            <div className="font-mono text-[11px] text-mute py-8">Chargement de la santé LLM…</div>
          ) : (
            <>
              {/* Bandeau d'état */}
              <div className={`hair bg-panel border-l-2 ${etat.bordure} flex items-center gap-3.5 px-4 py-3.5 mb-4`}>
                <span className={`material-symbols-outlined text-[22px] ${etat.couleur}`}>{etat.icone}</span>
                <div className="font-display font-semibold text-[16px]">{etat.label}</div>
                <span className={`ml-auto font-mono text-[10.5px] uppercase tracking-wider px-2.5 py-1 border-[0.5px] ${etat.couleur}`}>● {sante.etat_global}</span>
              </div>

              {/* KPI */}
              <div className="grid grid-cols-2 md:grid-cols-4 hair bg-panel mb-4">
                <Kpi icon="bolt" iconClass="text-soft" label={`Appels · ${range.label}`} valeur={formatNombre(sante.nb_appels)} sub="résumé · agent · vision" />
                <Kpi icon="error" iconClass="text-type-md" label="Erreurs" valeur={formatNombre(sante.nb_erreurs)} />
                <Kpi icon="percent" iconClass="text-type-md" label="Taux d'erreur" valeur={formatPourcent(sante.taux_erreur)} sub="orange ≥ 5 % · rouge ≥ 20 %" />
                <Kpi icon="timer" iconClass="text-type-ai" label="Latence p95 globale" valeur={formatLatence(sante.latence_p95_ms)} />
              </div>

              <div className="grid grid-cols-12 gap-4">
                {/* Latence par source */}
                <Widget title="Latence par source" icon="speed" className="col-span-12 lg:col-span-7" bodyFlush
                  footer={<><span>p50 = médiane · p95 = quasi-pire cas</span><span>{sante.par_source.length} source{sante.par_source.length > 1 ? 's' : ''}</span></>}>
                  <LatenceParSource sources={sante.par_source} />
                </Widget>

                {/* Répartition des appels */}
                <Widget title="Répartition des appels" icon="pie_chart" className="col-span-12 lg:col-span-5"
                  counter={`${formatNombre(sante.nb_appels)} appels`}>
                  <RepartitionAppels sources={sante.par_source} total={sante.nb_appels} />
                </Widget>

                {/* Derniers incidents */}
                <Widget title="Derniers incidents" icon="report" className="col-span-12" bodyFlush
                  counter={`${sante.derniers_incidents.length} récent${sante.derniers_incidents.length > 1 ? 's' : ''}`}>
                  <Incidents incidents={sante.derniers_incidents} />
                </Widget>
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  )
}

function Kpi({ icon, iconClass, label, valeur, sub }: {
  icon: string; iconClass: string; label: string; valeur: string; sub?: string
}) {
  return (
    <div className="p-[18px] hair-r last:border-r-0">
      <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-mute mb-2">
        <span className={`material-symbols-outlined text-[13px] ${iconClass}`}>{icon}</span> {label}
      </div>
      <div className="font-display font-medium text-[28px] leading-none tracking-tight tabular-nums">{valeur}</div>
      {sub && <div className="font-mono text-[10.5px] text-soft mt-1.5">{sub}</div>}
    </div>
  )
}

function LatenceParSource({ sources }: { sources: SanteParSource[] }) {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="font-mono text-[9.5px] uppercase tracking-wider text-mute">
          <th className="text-left px-3.5 py-2 hair-b font-medium">Source</th>
          <th className="text-right px-3.5 py-2 hair-b font-medium">Appels</th>
          <th className="text-right px-3.5 py-2 hair-b font-medium">p50</th>
          <th className="text-right px-3.5 py-2 hair-b font-medium">moy.</th>
          <th className="text-right px-3.5 py-2 hair-b font-medium">p95</th>
          <th className="text-right px-3.5 py-2 hair-b font-medium">Erreurs</th>
        </tr>
      </thead>
      <tbody>
        {sources.map(s => {
          const meta = sourceMeta(s.source)
          const enErreur = s.taux_erreur > 0
          return (
            <tr key={s.source} className="hover:bg-elev">
              <td className="px-3.5 py-2.5 hair-b last:border-b-0 text-[12.5px]">
                <span className="flex items-center gap-2">
                  <span className="w-[7px] h-[7px]" style={{ background: meta.couleur }} />
                  {meta.label}
                </span>
              </td>
              <td className="px-3.5 py-2.5 hair-b text-right font-mono text-[11.5px] text-soft tabular-nums">{formatNombre(s.nb_appels)}</td>
              <td className="px-3.5 py-2.5 hair-b text-right font-mono text-[11.5px] text-soft tabular-nums">{formatLatence(s.latence_p50_ms)}</td>
              <td className="px-3.5 py-2.5 hair-b text-right font-mono text-[11.5px] text-soft tabular-nums">{formatLatence(s.latence_moyenne_ms)}</td>
              <td className="px-3.5 py-2.5 hair-b text-right font-mono text-[11.5px] text-bright tabular-nums">{formatLatence(s.latence_p95_ms)}</td>
              <td className="px-3.5 py-2.5 hair-b text-right">
                <span className={`font-mono text-[10.5px] px-1.5 py-0.5 border-[0.5px] ${enErreur ? 'text-type-md border-type-md/40' : 'text-success border-success/40'}`}>
                  {formatPourcent(s.taux_erreur)}
                </span>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function RepartitionAppels({ sources, total }: { sources: SanteParSource[]; total: number }) {
  const tries = [...sources].sort((a, b) => b.nb_appels - a.nb_appels)
  return (
    <div className="flex flex-col gap-3.5">
      {tries.map(s => {
        const meta = sourceMeta(s.source)
        const pct = total > 0 ? Math.round((s.nb_appels / total) * 100) : 0
        return (
          <div key={s.source}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-2 text-[12px] text-bright">
                <span className="w-[7px] h-[7px]" style={{ background: meta.couleur }} />
                {meta.label}
              </span>
              <span className="font-mono text-[11px] text-soft">{pct} %</span>
            </div>
            <div className="h-1.5 bg-line2 overflow-hidden">
              <div className="h-full" style={{ width: `${pct}%`, background: meta.couleur }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Incidents({ incidents }: { incidents: SanteIncident[] }) {
  if (incidents.length === 0) {
    return <div className="px-3.5 py-8 font-mono text-[11px] text-mute text-center">Aucun incident sur la période.</div>
  }

  const formatQuand = (iso: string) => new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

  return (
    <div>
      {incidents.map((inc, i) => {
        const timeout = inc.statut.toLowerCase().includes('timeout')
        const icone = timeout ? 'timer_off' : 'error'
        const couleur = timeout ? 'text-type-md' : 'text-type-pdf'
        const meta = sourceMeta(inc.source)
        return (
          <div key={i} className="flex items-start gap-3 px-3.5 py-2.5 hair-b last:border-b-0 hover:bg-elev">
            <span className="font-mono text-[10.5px] text-mute w-[88px] shrink-0 pt-0.5">{formatQuand(inc.cree_le)}</span>
            <span className={`material-symbols-outlined text-[16px] shrink-0 ${couleur}`}>{icone}</span>
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] text-bright truncate">{inc.message_erreur ?? 'Erreur sans détail'}</div>
              <div className="font-mono text-[10px] text-mute mt-1 flex gap-2.5 flex-wrap">
                <span>{meta.label}</span>
                <span>{inc.modele}</span>
                <span>statut: {inc.statut}</span>
              </div>
            </div>
            <span className={`font-mono text-[11px] shrink-0 ${couleur}`}>{formatLatence(inc.latence_ms)}</span>
          </div>
        )
      })}
    </div>
  )
}

export default AdminSantePage
