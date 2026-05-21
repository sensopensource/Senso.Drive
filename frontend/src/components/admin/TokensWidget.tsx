import Widget from "./Widget"
import { useAdminTokens } from "../../hooks/useAdminTokens"
import { formatNombre } from "../../lib/format"
import type { TokensPoint } from "../../types"

type Props = {
  jours: number | null
  rangeLabel: string
  className?: string
}

// Construit les paths d'aire + ligne d'une sparkline a partir de la serie.
function buildSparkline(serie: TokensPoint[], width: number, height: number) {
  if (serie.length === 0) return null

  const valeurs = serie.map(p => p.tokens_in + p.tokens_out)
  const max = Math.max(...valeurs, 1)
  const pas = serie.length > 1 ? width / (serie.length - 1) : 0

  const points = valeurs.map((v, i) => {
    const x = i * pas
    const y = height - (v / max) * (height - 6) - 3  // marge haut/bas de 3px
    return { x, y }
  })

  const ligne = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const aire = `${ligne} L${width},${height} L0,${height} Z`
  const dernier = points[points.length - 1]

  return { ligne, aire, dernier }
}

function TokensWidget({ jours, rangeLabel, className }: Props) {
  const { tokens, isLoading } = useAdminTokens(jours)

  const counter = tokens
    ? `${formatNombre(tokens.total_tokens_in)} in / ${formatNombre(tokens.total_tokens_out)} out`
    : undefined

  return (
    <Widget
      title={`Consommation tokens · ${rangeLabel}`}
      icon="memory" iconClass="text-type-ai"
      counter={counter}
      className={className}
      footer={tokens && <>
        <span>{`coût estimé ≈ ${tokens.cout_estime_total.toFixed(2)} $`}</span>
      </>}
    >
      {isLoading || !tokens ? (
        <div className="h-[140px] bg-elev animate-pulse" />
      ) : (
        <TokensContent tokens={tokens} />
      )}
    </Widget>
  )
}

function TokensContent({ tokens }: { tokens: NonNullable<ReturnType<typeof useAdminTokens>['tokens']> }) {
  const total = tokens.total_tokens_in + tokens.total_tokens_out
  const spark = buildSparkline(tokens.serie_temporelle, 600, 64)

  const parSource = (s: string) =>
    tokens.par_source
      .filter(x => x.source === s)
      .reduce((acc, x) => acc + x.tokens_in + x.tokens_out, 0)

  return (
    <div>
      <div className="flex items-end gap-6 mb-3.5">
        <div>
          <div className="font-display font-medium text-[36px] leading-none tracking-tight tabular-nums">
            {formatNombre(total)}
          </div>
          <div className="font-mono text-[10.5px] text-mute mt-1">tokens total</div>
        </div>
      </div>

      {spark ? (
        <svg className="w-full h-16 block" viewBox="0 0 600 64" preserveAspectRatio="none">
          <path d={spark.aire} fill="rgba(168,156,214,.12)" />
          <path d={spark.ligne} fill="none" stroke="var(--type-ai)" strokeWidth="1" />
          <circle cx={spark.dernier.x} cy={spark.dernier.y} r="2.5" fill="var(--type-ai)" />
        </svg>
      ) : (
        <div className="h-16 flex items-center justify-center font-mono text-[10.5px] text-mute">
          aucune donnée sur la période
        </div>
      )}

      <div className="grid grid-cols-2 gap-px bg-line mt-3.5">
        <div className="bg-panel px-3 py-2.5">
          <div className="section-label mb-1">Résumés docs</div>
          <div className="font-display text-[16px] font-medium tabular-nums">{formatNombre(parSource('resume'))}</div>
        </div>
        <div className="bg-panel px-3 py-2.5">
          <div className="section-label mb-1">Agent IA</div>
          <div className="font-display text-[16px] font-medium tabular-nums">{formatNombre(parSource('suggestion'))}</div>
        </div>
      </div>
    </div>
  )
}

export default TokensWidget
