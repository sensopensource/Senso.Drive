import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import AppShell from "../components/AppShell"
import SubBar from "../components/SubBar"
import Widget from "../components/admin/Widget"
import { useAdminStockage } from "../hooks/useAdminStockage"
import { fileTypeMeta } from "../lib/fileTypes"
import { formatNombre, formatOctets } from "../lib/format"
import type { StockageParType, StockageConsommateur, StockagePoint } from "../types"

const RANGES: { cle: string; label: string; jours: number | null }[] = [
  { cle: '24h',  label: '24h',  jours: 1 },
  { cle: '7j',   label: '7j',   jours: 7 },
  { cle: '30j',  label: '30j',  jours: 30 },
  { cle: 'tout', label: 'tout', jours: null },
]

// Quota fixe identique pour tous les utilisateurs (#8).
const QUOTA_OCTETS = 20 * 1024 * 1024 * 1024

function AdminStockagePage() {
  const [rangeCle, setRangeCle] = useState('30j')
  const range = RANGES.find(r => r.cle === rangeCle) ?? RANGES[2]
  const { stockage, isLoading } = useAdminStockage(range.jours)
  const queryClient = useQueryClient()

  let nbDocuments = 0
  let typeDominant: StockageParType | null = null
  if (stockage) {
    for (const u of stockage.top_consommateurs) {
      nbDocuments += u.nb_documents
    }
    for (const t of stockage.par_type) {
      if (typeDominant === null || t.taille_octets > typeDominant.taille_octets) {
        typeDominant = t
      }
    }
  }

  const partDominant = stockage && typeDominant && stockage.total_octets > 0
    ? Math.round((typeDominant.taille_octets / stockage.total_octets) * 100)
    : 0

  return (
    <AppShell>
      <div className="flex-1 flex flex-col min-h-0">
        <SubBar>
          <div className="font-mono text-[11px] text-mute">admin · <b className="text-bright font-medium">stockage</b></div>
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
            onClick={() => queryClient.invalidateQueries({ queryKey: ['admin', 'stockage'] })}
            className="btn-ghost inline-flex items-center"
            title="Rafraîchir"
          >
            <span className="material-symbols-outlined text-[14px] leading-none">refresh</span>
          </button>
        </SubBar>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isLoading || !stockage ? (
            <div className="font-mono text-[11px] text-mute py-8">Chargement du stockage…</div>
          ) : (
            <>
              {/* KPI */}
              <div className="grid grid-cols-2 md:grid-cols-4 hair bg-panel mb-4">
                <Kpi icon="database" iconClass="text-soft" label="Espace total" valeur={formatOctets(stockage.total_octets)} sub="toutes versions · corbeille incluse" />
                <Kpi icon="description" iconClass="text-type-docx" label="Documents" valeur={formatNombre(nbDocuments)} />
                <Kpi
                  icon={typeDominant ? fileTypeMeta(typeDominant.type_fichier).icone : 'category'}
                  iconClass="text-type-pdf"
                  label="Type dominant"
                  valeur={typeDominant ? fileTypeMeta(typeDominant.type_fichier).label : '—'}
                  sub={typeDominant ? `${formatOctets(typeDominant.taille_octets)} · ${partDominant} %` : undefined}
                />
                <Kpi icon="groups" iconClass="text-type-ai" label="Consommateurs" valeur={String(stockage.top_consommateurs.length)} sub="quota 20 Go / utilisateur" />
              </div>

              <div className="grid grid-cols-12 gap-4">
                {/* Évolution */}
                <Widget
                  title="Évolution du stockage"
                  icon="show_chart"
                  iconClass="text-type-ai"
                  counter={range.jours == null ? "tout l'historique" : `${range.jours} derniers jours`}
                  className="col-span-12 lg:col-span-8"
                  footer={<><span>cumulé sur la période</span><span>màj en direct</span></>}
                >
                  <ChartStockage serie={stockage.serie_temporelle} />
                </Widget>

                {/* Par type */}
                <Widget title="Par type de fichier" icon="donut_small" className="col-span-12 lg:col-span-4"
                  footer={<><span>{stockage.par_type.length} type{stockage.par_type.length > 1 ? 's' : ''}</span><span>{formatOctets(stockage.total_octets)}</span></>}>
                  <ParType parType={stockage.par_type} total={stockage.total_octets} />
                </Widget>

                {/* Top consommateurs */}
                <Widget title="Top consommateurs" icon="leaderboard" className="col-span-12"
                  counter={`${stockage.top_consommateurs.length} utilisateur${stockage.top_consommateurs.length > 1 ? 's' : ''}`} bodyFlush>
                  <TopConsommateurs users={stockage.top_consommateurs} />
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

function ChartStockage({ serie }: { serie: StockagePoint[] }) {
  const W = 620
  const H = 150

  const labelJour = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })

  if (serie.length < 2) {
    return <div className="h-[150px] flex items-center justify-center font-mono text-[11px] text-mute">Pas assez de données sur la période.</div>
  }

  const maxCumul = Math.max(...serie.map(p => p.taille_cumulee), 1)
  const maxJour = Math.max(...serie.map(p => p.taille_octets), 1)
  const pas = W / (serie.length - 1)

  let ligne = ''
  for (let i = 0; i < serie.length; i++) {
    const x = i * pas
    const y = H - (serie[i].taille_cumulee / maxCumul) * (H - 10) - 4
    ligne += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)} `
  }
  const aire = `${ligne} L${W},${H} L0,${H} Z`

  const largeurBarre = Math.max(2, pas * 0.3)

  return (
    <div>
      <div className="flex items-end gap-6 mb-3.5">
        <div>
          <div className="font-display font-medium text-[32px] leading-none tracking-tight tabular-nums">{formatOctets(serie[serie.length - 1].taille_cumulee)}</div>
          <div className="font-mono text-[10.5px] text-mute mt-1">cumulé sur la période</div>
        </div>
        <div className="ml-auto flex gap-4 font-mono text-[10.5px] text-soft">
          <span className="flex items-center gap-1.5"><i className="inline-block w-2.5 h-0.5" style={{ background: 'var(--type-ai)' }} /> cumulé</span>
          <span className="flex items-center gap-1.5"><i className="inline-block w-2 h-2" style={{ background: 'rgba(106,143,201,.45)' }} /> ajouté / jour</span>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-[150px] block">
        <line x1="0" y1="37" x2={W} y2="37" stroke="var(--line)" strokeWidth="0.5" />
        <line x1="0" y1="75" x2={W} y2="75" stroke="var(--line)" strokeWidth="0.5" />
        <line x1="0" y1="113" x2={W} y2="113" stroke="var(--line)" strokeWidth="0.5" />
        {serie.map((p, i) => {
          const hauteur = (p.taille_octets / maxJour) * (H - 20)
          return <rect key={i} x={i * pas - largeurBarre / 2} y={H - hauteur} width={largeurBarre} height={hauteur} fill="rgba(106,143,201,.45)" />
        })}
        <path d={aire} fill="rgba(168,156,214,.13)" />
        <path d={ligne} fill="none" stroke="var(--type-ai)" strokeWidth="1.2" />
      </svg>
      <div className="flex justify-between font-mono text-[8.5px] text-mute mt-1">
        <span>{labelJour(serie[0].jour)}</span>
        <span>{labelJour(serie[serie.length - 1].jour)}</span>
      </div>
    </div>
  )
}

function ParType({ parType, total }: { parType: StockageParType[]; total: number }) {
  const tries = [...parType].sort((a, b) => b.taille_octets - a.taille_octets)
  return (
    <div className="flex flex-col gap-3.5">
      {tries.map(t => {
        const meta = fileTypeMeta(t.type_fichier)
        const pct = total > 0 ? Math.round((t.taille_octets / total) * 100) : 0
        return (
          <div key={t.type_fichier}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-2 text-[12px] text-bright">
                <span className="w-[7px] h-[7px]" style={{ background: meta.couleur }} />
                {meta.label}
              </span>
              <span className="font-mono text-[11px] text-soft">{formatOctets(t.taille_octets)}</span>
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

function TopConsommateurs({ users }: { users: StockageConsommateur[] }) {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="font-mono text-[9.5px] uppercase tracking-wider text-mute">
          <th className="text-left px-3.5 py-2 hair-b font-medium w-8">#</th>
          <th className="text-left px-3.5 py-2 hair-b font-medium">Utilisateur</th>
          <th className="text-left px-3.5 py-2 hair-b font-medium">Part du quota (20 Go)</th>
          <th className="text-right px-3.5 py-2 hair-b font-medium">Documents</th>
          <th className="text-right px-3.5 py-2 hair-b font-medium">Espace utilisé</th>
        </tr>
      </thead>
      <tbody>
        {users.map((u, i) => {
          const pct = Math.min(100, Math.round((u.taille_octets / QUOTA_OCTETS) * 100))
          return (
            <tr key={u.id_utilisateur} className="hover:bg-elev">
              <td className="px-3.5 py-2.5 hair-b last:border-b-0 font-mono text-[11px] text-mute">{String(i + 1).padStart(2, '0')}</td>
              <td className="px-3.5 py-2.5 hair-b text-[12.5px]">
                <span className="flex items-center gap-2.5">
                  <span className="w-[22px] h-[22px] bg-elev hair flex items-center justify-center text-[10px] text-soft uppercase">{u.nom.charAt(0)}</span>
                  {u.nom}
                </span>
              </td>
              <td className="px-3.5 py-2.5 hair-b">
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block w-[120px] h-[5px] bg-line2 align-middle overflow-hidden">
                    <span className="block h-full bg-soft" style={{ width: `${pct}%` }} />
                  </span>
                  <span className="font-mono text-[11px] text-soft">{pct} %</span>
                </span>
              </td>
              <td className="px-3.5 py-2.5 hair-b text-right font-mono text-[11.5px] text-soft tabular-nums">{formatNombre(u.nb_documents)}</td>
              <td className="px-3.5 py-2.5 hair-b text-right font-mono text-[11.5px] text-soft tabular-nums">{formatOctets(u.taille_octets)}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

export default AdminStockagePage
