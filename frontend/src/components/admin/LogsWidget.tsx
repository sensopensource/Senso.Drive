import { useState } from "react"
import Widget from "./Widget"
import { useLogStream } from "../../hooks/useLogStream"

type Props = {
  className?: string
}

const NIVEAUX = ['tout', 'info', 'ok', 'warn', 'err'] as const
type Niveau = typeof NIVEAUX[number]

const COULEUR_NIVEAU: Record<string, string> = {
  info: 'text-soft',
  ok:   'text-success',
  warn: 'text-type-md',
  err:  'text-danger',
}

function heure(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function LogsWidget({ className }: Props) {
  const [paused, setPaused] = useState(false)
  const [filtre, setFiltre] = useState<Niveau>('tout')
  const [recherche, setRecherche] = useState('')

  const { logs, connected } = useLogStream(paused)

  const rechercheLower = recherche.trim().toLowerCase()
  const visibles = logs.filter(log => {
    if (filtre !== 'tout' && log.niveau !== filtre) return false
    if (rechercheLower && !`${log.action} ${log.message}`.toLowerCase().includes(rechercheLower)) return false
    return true
  })

  const actions = (
    <button
      type="button"
      onClick={() => setPaused(p => !p)}
      className="w-6 h-6 flex items-center justify-center text-mute hover:text-bright hover:bg-elev transition-colors"
      title={paused ? 'Reprendre' : 'Pause'}
    >
      <span className="material-symbols-outlined text-[14px]">{paused ? 'play_arrow' : 'pause'}</span>
    </button>
  )

  return (
    <Widget
      title="Flux d'évènements"
      icon="terminal" iconClass="text-type-md"
      counter={
        <span className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${connected && !paused ? 'bg-success' : 'bg-mute'}`} />
          {paused ? 'en pause' : connected ? 'stream live' : 'connexion…'}
        </span>
      }
      actions={actions}
      bodyFlush
      className={className}
    >
      {/* Barre de filtres */}
      <div className="flex items-center px-3.5 py-1.5 hair-b bg-ink">
        {NIVEAUX.map(n => (
          <button
            key={n}
            type="button"
            onClick={() => setFiltre(n)}
            className={`font-mono text-[9.5px] uppercase tracking-wider px-2 py-0.5 mr-1.5 hair transition-colors ${
              filtre === n ? 'text-bright border-line2 bg-elev' : 'text-mute hover:text-soft'
            }`}
          >
            {n}
          </button>
        ))}
        <input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="filtrer par action, message…"
          className="ml-auto bg-transparent border-0 text-bright font-mono text-[11px] outline-none w-[200px] placeholder:text-mute"
        />
      </div>

      {/* Stream */}
      <div className="flex flex-col max-h-[320px] overflow-y-auto font-mono text-[11px]">
        {visibles.length === 0 ? (
          <div className="px-3.5 py-6 text-center text-[10.5px] text-mute">
            {logs.length === 0 ? 'En attente d\'évènements…' : 'Aucun évènement ne correspond au filtre'}
          </div>
        ) : (
          visibles.map(log => (
            <div key={log.id} className="grid grid-cols-[78px_56px_80px_1fr] gap-3 px-3.5 py-1.5 hair-b last:border-b-0 hover:bg-elev items-baseline">
              <span className="text-mute text-[10px]">{heure(log.cree_le)}</span>
              <span className={`text-[9.5px] uppercase tracking-wider ${COULEUR_NIVEAU[log.niveau] ?? 'text-soft'}`}>{log.niveau}</span>
              <span className="text-soft text-[10.5px] truncate">{log.id_utilisateur != null ? `#${log.id_utilisateur}` : 'système'}</span>
              <span className="text-bright font-body text-[12px] truncate">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </Widget>
  )
}

export default LogsWidget
