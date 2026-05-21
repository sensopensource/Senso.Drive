import Widget from "./Widget"
import { useOverview } from "../../hooks/useOverview"
import { formatNombre } from "../../lib/format"

type Props = {
  jours: number | null
  className?: string
}

const COULEUR_TYPE: Record<string, string> = {
  pdf:  'var(--type-pdf)',
  docx: 'var(--type-docx)',
  md:   'var(--type-md)',
  txt:  'var(--type-txt)',
}

const LIBELLE_TYPE: Record<string, string> = {
  pdf:  'PDF',
  docx: 'DOCX',
  md:   'Markdown',
  txt:  'TXT',
}

function DocTypesWidget({ jours, className }: Props) {
  const { overview, isLoading } = useOverview(jours)

  const types = overview?.docs_par_type ?? []
  const total = types.reduce((acc, t) => acc + t.nb_documents, 0)
  const max = Math.max(...types.map(t => t.nb_documents), 1)

  return (
    <Widget
      title="Documents par type"
      icon="draft"
      counter={overview ? `${formatNombre(total)} docs · ${types.length} formats` : undefined}
      className={className}
    >
      {isLoading || !overview ? (
        <div className="font-mono text-[10.5px] text-mute">Chargement…</div>
      ) : types.length === 0 ? (
        <div className="font-mono text-[10.5px] text-mute">Aucun document</div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {types.map(t => {
            const couleur = COULEUR_TYPE[t.type_fichier] ?? 'var(--mute)'
            const libelle = LIBELLE_TYPE[t.type_fichier] ?? (t.type_fichier || 'Autres')
            const pct = total > 0 ? Math.round((t.nb_documents / total) * 100) : 0
            return (
              <div key={t.type_fichier} className="grid grid-cols-[14px_1fr_auto] gap-2.5 items-center">
                <span className="w-2 h-2" style={{ background: couleur }} />
                <span className="text-[12.5px] text-bright">{libelle}</span>
                <span className="font-mono text-[10.5px] text-soft tabular-nums">{t.nb_documents} · {pct} %</span>
                <div className="col-span-3 h-0.5 bg-line overflow-hidden -mt-1">
                  <div className="h-full" style={{ width: `${(t.nb_documents / max) * 100}%`, background: couleur }} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Widget>
  )
}

export default DocTypesWidget
