import { useStockage } from "../../hooks/useStockage"
import { formatOctets } from "../../lib/format"

// Carte espace de stockage : jauge + invitation à contacter Senso.
function StockageCard() {
  const { utilise, quota } = useStockage()
  const pourcent = quota > 0 ? Math.round((utilise / quota) * 100) : 0
  const libre = Math.max(0, quota - utilise)

  return (
    <section className="hair bg-panel">
      <div className="px-[22px] pt-[22px] pb-5">
        <div className="font-display font-semibold text-[30px] tracking-tight">
          {formatOctets(utilise)} <span className="text-[14px] text-soft font-normal">sur {formatOctets(quota)}</span>
        </div>
        <div className="h-2.5 bg-line rounded overflow-hidden my-4">
          <div className="h-full bg-soft rounded" style={{ width: `${pourcent}%` }} />
        </div>
        <div className="flex justify-between text-[12.5px] text-soft">
          <span>{pourcent} % utilisé</span>
          <span>{formatOctets(libre)} libres</span>
        </div>
        <p className="mt-4 text-[13px] text-soft leading-relaxed">
          {pourcent < 80 ? 'Vous avez de la marge.' : 'Votre espace se remplit.'} Pour agrandir votre espace, <b className="text-bright font-semibold">contactez Senso</b>.
        </p>
      </div>

      {/* Tâches de fond Slavy — placeholder « à venir » (pas encore d'endpoint, cf dette #1-front) */}
      <div className="flex items-center gap-2.5 px-[22px] py-3.5 hair-t opacity-60">
        <span className="w-[7px] h-[7px] rounded-full bg-mute shrink-0" />
        <span className="flex-1 text-[13px] text-soft">Bientôt : suivez ici ce que Slavy fait en direct.</span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-mute">à venir</span>
      </div>
    </section>
  )
}

export default StockageCard
