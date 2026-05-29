import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import AppShell from "../components/AppShell"
import SubBar from "../components/SubBar"
import Widget from "../components/admin/Widget"
import { useAdminTokens } from "../hooks/useAdminTokens"
import { formatNombre } from "../lib/format"

const RANGES: { cle: string; label: string; jours: number | null }[] = [
  { cle: '24h',  label: '24h',  jours: 1 },
  { cle: '7j',   label: '7j',   jours: 7 },
  { cle: '30j',  label: '30j',  jours: 30 },
  { cle: 'tout', label: 'tout', jours: null },
]

const SOURCE_META: Record<string, { label: string; couleur: string }> = {
  suggestion: { label: 'Agent Slavy',           couleur: 'var(--type-ai)' },
  resume:     { label: 'Résumés de documents',  couleur: 'var(--success)' },
}

function formatEuro(n: number): string {
  return `${n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
}

// Sous-titre du KPI coût : dérivé des modèles réellement facturés (cout_estime > 0).
function coutSousTitre(modeles: { modele: string; cout_estime: number }[]): string {
  const payants = modeles.filter(m => m.cout_estime > 0)
  if (payants.length === 0) return 'estimation'
  if (payants.length === 1) return `estimation · ${payants[0].modele} seul`
  return `estimation · ${payants.length} modèles`
}

// Chemin SVG (ligne) pour une série de valeurs dans une box width×height.
function pathLigne(valeurs: number[], max: number, width: number, height: number): string {
  if (valeurs.length === 0) return ''
  const pas = valeurs.length > 1 ? width / (valeurs.length - 1) : 0
  return valeurs
    .map((v, i) => {
      const x = i * pas
      const y = height - (v / max) * (height - 8) - 4
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

function AdminTokensPage() {
  const [rangeCle, setRangeCle] = useState('7j')
  const range = RANGES.find(r => r.cle === rangeCle) ?? RANGES[1]
  const { tokens, isLoading } = useAdminTokens(range.jours)
  const queryClient = useQueryClient()

  const total = tokens ? tokens.total_tokens_in + tokens.total_tokens_out : 0

  return (
    <AppShell>
      <div className="flex-1 flex flex-col min-h-0">
        <SubBar>
          <div className="font-mono text-[11px] text-mute">admin · <b className="text-bright font-medium">tokens &amp; coûts</b></div>
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
            onClick={() => queryClient.invalidateQueries({ queryKey: ['admin', 'tokens'] })}
            className="btn-ghost inline-flex items-center"
            title="Rafraîchir"
          >
            <span className="material-symbols-outlined text-[14px] leading-none">refresh</span>
          </button>
        </SubBar>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isLoading || !tokens ? (
            <div className="font-mono text-[11px] text-mute py-8">Chargement des consommations…</div>
          ) : (
            <>
              {/* KPI */}
              <div className="grid grid-cols-2 md:grid-cols-4 hair bg-panel mb-4">
                <Kpi icon="memory" iconClass="text-soft" label={`Tokens total · ${range.label}`} valeur={formatNombre(total)} sub="in + out" />
                <Kpi icon="south_west" iconClass="text-type-ai" label="Tokens in" valeur={formatNombre(tokens.total_tokens_in)} />
                <Kpi icon="north_east" iconClass="text-type-docx" label="Tokens out" valeur={formatNombre(tokens.total_tokens_out)} />
                <Kpi icon="euro" iconClass="text-warn" label="Coût estimé" valeur={formatEuro(tokens.cout_estime_total)} valeurClass="text-warn" sub={coutSousTitre(tokens.par_modele)} />
              </div>

              <div className="grid grid-cols-12 gap-4">
                {/* Chart série temporelle */}
                <Widget
                  title="Consommation dans le temps"
                  icon="show_chart"
                  iconClass="text-type-ai"
                  counter={range.jours == null ? 'tout l\'historique' : `${range.jours} derniers jours`}
                  className="col-span-12 lg:col-span-8"
                  footer={<><span>màj en direct</span><span>coût = estimation (tarifs API)</span></>}
                >
                  <ChartTokens serie={tokens.serie_temporelle} total={total} cout={tokens.cout_estime_total} />
                </Widget>

                {/* Par source */}
                <Widget title="Par source" icon="call_split" className="col-span-12 lg:col-span-4" bodyFlush
                  footer={<><span>{tokens.par_source.length} source{tokens.par_source.length > 1 ? 's' : ''}</span><span>résumés = <b className="text-success">local</b></span></>}>
                  <ParSource sources={tokens.par_source} />
                </Widget>

                {/* Par modèle */}
                <Widget title="Par modèle" icon="smart_toy" className="col-span-12"
                  counter={`${tokens.par_modele.length} modèle${tokens.par_modele.length > 1 ? 's' : ''}`} bodyFlush>
                  <ParModele modeles={tokens.par_modele} />
                </Widget>
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  )
}

function Kpi({ icon, iconClass, label, valeur, valeurClass, sub }: {
  icon: string; iconClass: string; label: string; valeur: string; valeurClass?: string; sub?: string
}) {
  return (
    <div className="p-[18px] hair-r last:border-r-0">
      <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-mute mb-2">
        <span className={`material-symbols-outlined text-[13px] ${iconClass}`}>{icon}</span> {label}
      </div>
      <div className={`font-display font-medium text-[28px] leading-none tracking-tight tabular-nums ${valeurClass ?? ''}`}>{valeur}</div>
      {sub && <div className="font-mono text-[10.5px] text-soft mt-1.5">{sub}</div>}
    </div>
  )
}

function ChartTokens({ serie, total, cout }: { serie: { jour: string; tokens_in: number; tokens_out: number }[]; total: number; cout: number }) {
  const W = 620
  const H = 140
  const valeursIn = serie.map(p => p.tokens_in)
  const valeursOut = serie.map(p => p.tokens_out)
  const max = Math.max(...valeursIn, ...valeursOut, 1)
  const ligneIn = pathLigne(valeursIn, max, W, H)
  const ligneOut = pathLigne(valeursOut, max, W, H)
  const aireIn = ligneIn ? `${ligneIn} L${W},${H} L0,${H} Z` : ''

  const labelJour = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })

  return (
    <div>
      <div className="flex items-end gap-6 mb-3.5">
        <div>
          <div className="font-display font-medium text-[32px] leading-none tracking-tight tabular-nums">{formatNombre(total)}</div>
          <div className="font-mono text-[10.5px] text-mute mt-1">tokens · ≈ {formatEuro(cout)} (estimation)</div>
        </div>
        <div className="ml-auto flex gap-4 font-mono text-[10.5px] text-soft">
          <span className="flex items-center gap-1.5"><i className="inline-block w-2.5 h-0.5" style={{ background: 'var(--type-ai)' }} /> tokens in</span>
          <span className="flex items-center gap-1.5"><i className="inline-block w-2.5 h-0.5" style={{ background: 'var(--type-docx)' }} /> tokens out</span>
        </div>
      </div>

      {serie.length < 2 ? (
        <div className="h-[140px] flex items-center justify-center font-mono text-[11px] text-mute">Pas assez de données sur la période.</div>
      ) : (
        <>
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-[140px] block">
            <line x1="0" y1="34" x2={W} y2="34" stroke="var(--line)" strokeWidth="0.5" />
            <line x1="0" y1="68" x2={W} y2="68" stroke="var(--line)" strokeWidth="0.5" />
            <line x1="0" y1="102" x2={W} y2="102" stroke="var(--line)" strokeWidth="0.5" />
            <path d={aireIn} fill="rgba(168,156,214,.13)" />
            <path d={ligneIn} fill="none" stroke="var(--type-ai)" strokeWidth="1.2" />
            <path d={ligneOut} fill="none" stroke="var(--type-docx)" strokeWidth="1.2" strokeDasharray="3 2" />
          </svg>
          <div className="flex justify-between font-mono text-[8.5px] text-mute mt-1">
            <span>{labelJour(serie[0].jour)}</span>
            <span>{labelJour(serie[serie.length - 1].jour)}</span>
          </div>
        </>
      )}
    </div>
  )
}

function ParSource({ sources }: { sources: { source: string; tokens_in: number; tokens_out: number; cout_estime: number }[] }) {
  const max = Math.max(...sources.map(s => s.tokens_in + s.tokens_out), 1)
  return (
    <div className="flex flex-col gap-px bg-line">
      {sources.map(s => {
        const meta = SOURCE_META[s.source] ?? { label: s.source, couleur: 'var(--soft)' }
        const totalSource = s.tokens_in + s.tokens_out
        const gratuit = s.cout_estime === 0
        return (
          <div key={s.source} className="bg-panel px-3.5 py-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2" style={{ background: meta.couleur }} />
              <span className="text-[12.5px] text-bright flex-1">{meta.label}</span>
              <span className={`font-mono text-[11px] ${gratuit ? 'text-success' : 'text-warn'}`}>{formatEuro(s.cout_estime)}</span>
            </div>
            <div className="flex gap-3.5 font-mono text-[10px] text-soft">
              <span>{formatNombre(s.tokens_in)} in</span>
              <span>{formatNombre(s.tokens_out)} out</span>
            </div>
            <div className="h-[3px] bg-line mt-2 overflow-hidden">
              <div className="h-full" style={{ width: `${Math.round((totalSource / max) * 100)}%`, background: meta.couleur }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ParModele({ modeles }: { modeles: { modele: string; tokens_in: number; tokens_out: number; cout_estime: number }[] }) {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="font-mono text-[9.5px] uppercase tracking-wider text-mute">
          <th className="text-left px-3.5 py-2 hair-b font-medium">Modèle</th>
          <th className="text-right px-3.5 py-2 hair-b font-medium">Tokens in</th>
          <th className="text-right px-3.5 py-2 hair-b font-medium">Tokens out</th>
          <th className="text-right px-3.5 py-2 hair-b font-medium">Coût est.</th>
        </tr>
      </thead>
      <tbody>
        {modeles.map(m => {
          const local = m.cout_estime === 0
          return (
            <tr key={m.modele} className="hover:bg-elev">
              <td className="px-3.5 py-2.5 hair-b last:border-b-0 text-[12.5px]">
                <span className={`font-mono text-[9.5px] uppercase tracking-wider px-1.5 py-0.5 border-[0.5px] ${local ? 'text-success border-success/40' : 'text-type-ai border-type-ai/40'}`}>
                  {m.modele}{local ? ' · local' : ''}
                </span>
              </td>
              <td className="px-3.5 py-2.5 hair-b text-right font-mono text-[11.5px] text-soft tabular-nums">{formatNombre(m.tokens_in)}</td>
              <td className="px-3.5 py-2.5 hair-b text-right font-mono text-[11.5px] text-soft tabular-nums">{formatNombre(m.tokens_out)}</td>
              <td className={`px-3.5 py-2.5 hair-b text-right font-mono text-[11.5px] tabular-nums ${local ? 'text-success' : 'text-warn'}`}>{formatEuro(m.cout_estime)}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

export default AdminTokensPage
