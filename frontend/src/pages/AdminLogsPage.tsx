import { useState } from "react"
import AppShell from "../components/AppShell"
import SubBar from "../components/SubBar"
import { useLogStream } from "../hooks/useLogStream"
import { useAdminUsers } from "../hooks/useAdminUsers"
import type { LogRead } from "../types"

type NiveauFiltre = 'tous' | 'info' | 'ok' | 'warn' | 'err'

const NIVEAU_COLOR: Record<string, string> = { info: 'text-soft', ok: 'text-success', warn: 'text-warn', err: 'text-danger' }
const NIVEAU_DOT: Record<string, string> = { info: 'var(--soft)', ok: 'var(--success)', warn: 'var(--warn)', err: 'var(--danger)' }

const CHIPS: { cle: NiveauFiltre; label: string }[] = [
  { cle: 'tous', label: 'tout' },
  { cle: 'info', label: 'info' },
  { cle: 'ok',   label: 'ok' },
  { cle: 'warn', label: 'warn' },
  { cle: 'err',  label: 'err' },
]

// grille partagee en-tete + lignes : heure / niveau / action / user / message / ip / expand
const COLS = "grid-cols-[96px_56px_180px_120px_1fr_110px_28px]"

function heure(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function AdminLogsPage() {
  const [paused, setPaused] = useState(false)
  const { logs, connected } = useLogStream(paused)
  const { users } = useAdminUsers()
  const [niveau, setNiveau] = useState<NiveauFiltre>('tous')
  const [recherche, setRecherche] = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)

  const nomUser = (id: number | null) => {
    if (id == null) return 'système'
    return users.find(u => u.id === id)?.nom ?? `#${id}`
  }

  const filtres = logs.filter(l => {
    if (niveau !== 'tous' && l.niveau !== niveau) return false
    const q = recherche.trim().toLowerCase()
    if (q && !l.message.toLowerCase().includes(q) && !l.action.toLowerCase().includes(q) && !(l.adresse_ip ?? '').includes(q)) return false
    return true
  })

  const live = connected && !paused

  return (
    <AppShell>
      <div className="flex-1 flex flex-col min-h-0">
        <SubBar>
          <div className="font-mono text-[11px] text-mute">admin · <b className="text-bright font-medium">logs</b></div>
          <span className={`flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-wider ${live ? 'text-success' : 'text-mute'}`}>
            <span className={`w-[7px] h-[7px] rounded-full ${live ? 'bg-success animate-pulse' : 'bg-mute'}`} />
            {paused ? 'en pause' : 'live'}
          </span>
          <button onClick={() => setPaused(p => !p)} className="ml-auto btn-ghost inline-flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px] leading-none">{paused ? 'play_arrow' : 'pause'}</span>
            {paused ? 'Reprendre' : 'Pause'}
          </button>
        </SubBar>

        {/* Filtres */}
        <div className="hair-b flex items-center gap-2.5 px-6 py-2.5">
          <div className="flex gap-1.5">
            {CHIPS.map(c => (
              <button
                key={c.cle}
                type="button"
                onClick={() => setNiveau(c.cle)}
                className={`font-mono text-[9.5px] uppercase tracking-wider px-2.5 py-1 hair inline-flex items-center gap-1.5 transition-colors ${
                  niveau === c.cle ? 'text-bright bg-elev !border-line2' : 'text-mute hover:text-soft'
                }`}
              >
                {c.cle !== 'tous' && <span className="w-1.5 h-1.5" style={{ background: NIVEAU_DOT[c.cle] }} />}
                {c.label}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2 hair px-2.5 py-1.5 min-w-[240px]">
            <span className="material-symbols-outlined text-[15px] text-mute">search</span>
            <input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="message, ip, action…"
              className="flex-1 bg-transparent border-0 outline-none font-mono text-[11.5px] text-bright placeholder:text-mute"
            />
          </div>
        </div>

        {/* En-tete colonnes */}
        <div className={`grid ${COLS} gap-3.5 px-6 py-2 hair-b font-mono text-[9px] uppercase tracking-wider text-mute`}>
          <span>Heure</span><span>Niveau</span><span>Action</span><span>Utilisateur</span><span>Message</span><span className="text-right">IP</span><span></span>
        </div>

        {/* Stream */}
        <div className="flex-1 overflow-y-auto">
          {filtres.map(l => (
            <LogLine key={l.id} log={l} nom={nomUser(l.id_utilisateur)} expanded={expanded === l.id} onToggle={() => setExpanded(expanded === l.id ? null : l.id)} />
          ))}
          {filtres.length === 0 && (
            <div className="font-mono text-[11px] text-mute px-6 py-8">
              {recherche || niveau !== 'tous' ? 'Aucun log ne correspond aux filtres.' : "Aucun log pour l'instant."}
            </div>
          )}
        </div>

        {/* Pied */}
        <div className="shrink-0 hair-t px-6 py-2.5 flex items-center justify-between font-mono text-[10.5px] text-mute">
          <span>{filtres.length} affiché{filtres.length > 1 ? 's' : ''}{logs.length !== filtres.length ? ` · ${logs.length} dans le buffer` : ''}</span>
          <span>buffer live · 100 max</span>
        </div>
      </div>
    </AppShell>
  )
}

function LogLine({ log, nom, expanded, onToggle }: { log: LogRead; nom: string; expanded: boolean; onToggle: () => void }) {
  const niveauColor = NIVEAU_COLOR[log.niveau] ?? 'text-soft'
  const aContexte = log.contexte != null && Object.keys(log.contexte).length > 0
  const agent = log.action.startsWith('agent.')

  return (
    <>
      <div
        onClick={aContexte ? onToggle : undefined}
        className={`grid ${COLS} gap-3.5 px-6 py-2 hair-b items-baseline ${aContexte ? 'cursor-pointer hover:bg-elev' : ''}`}
      >
        <span className="font-mono text-[10px] text-mute">{heure(log.cree_le)}</span>
        <span className={`font-mono text-[9px] uppercase tracking-wider ${niveauColor}`}>{log.niveau}</span>
        <span className={`font-mono text-[10.5px] truncate ${agent ? 'text-type-ai' : 'text-soft'}`}>{log.action}</span>
        <span className="font-mono text-[10.5px] text-soft truncate">{nom}</span>
        <span className="font-body text-[12px] text-bright truncate">{log.message}</span>
        <span className="font-mono text-[10px] text-mute text-right">{log.adresse_ip ?? '—'}</span>
        <span className="flex justify-center text-mute">
          {aContexte && <span className="material-symbols-outlined text-[14px]">{expanded ? 'expand_more' : 'chevron_right'}</span>}
        </span>
      </div>
      {expanded && aContexte && (
        <div className="hair-b bg-ink px-6 py-3 pl-[110px]">
          <pre className="m-0 font-mono text-[11px] text-soft leading-relaxed p-3 hair bg-panel overflow-x-auto">{JSON.stringify(log.contexte, null, 2)}</pre>
        </div>
      )}
    </>
  )
}

export default AdminLogsPage
