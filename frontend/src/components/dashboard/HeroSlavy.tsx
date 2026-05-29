import { useAuth } from "../../contexts/AuthContext"
import { useAgent } from "../../contexts/AgentContext"
import { useDashboard } from "../../hooks/useDashboard"
import { useCategories } from "../../hooks/useCategories"
import { useStockage } from "../../hooks/useStockage"
import { LABELS } from "../../lib/labels"

// Hero éditorial du tableau de bord : accroche Slavy + CTA + stats inline.
function HeroSlavy() {
  const { user } = useAuth()
  const { pendingCount, startAnalysis, analysisRunning, openSuggestions } = useAgent()
  const { documentsTotal } = useDashboard()
  const { categories } = useCategories()
  const { utilise, quota } = useStockage()

  const prenom = user?.nom ? user.nom.split(' ')[0] : ''
  const pourcentEspace = quota > 0 ? Math.round((utilise / quota) * 100) : 0
  const aDesIdees = pendingCount > 0

  return (
    <section
      className="relative hair overflow-hidden px-9 py-8 mb-6"
      style={{ background: "radial-gradient(120% 140% at 12% 0%, rgba(168,156,214,.16), transparent 55%), var(--panel)" }}
    >
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-type-ai mb-3.5">
        <span className="material-symbols-outlined text-[13px]">auto_awesome</span> Votre assistant
      </div>

      <h1 className="font-display font-bold text-[32px] leading-[1.1] tracking-tight max-w-[620px] mb-3">
        {aDesIdees
          ? `Bonjour ${prenom}. ${LABELS.slavy.nom} a ${pendingCount} idée${pendingCount > 1 ? 's' : ''} pour ranger vos documents.`
          : `Bonjour ${prenom}. Votre bibliothèque est bien rangée.`}
      </h1>

      <p className="text-[14px] text-soft leading-[1.55] max-w-[560px] mb-[22px]">
        {aDesIdees
          ? `${LABELS.slavy.nom} a analysé votre bibliothèque et a quelques idées d'organisation. Validez-les en un clic, ou relancez une analyse.`
          : "Rien à ranger pour l'instant. Relancez une analyse après avoir ajouté de nouveaux documents."}
      </p>

      <div className="flex flex-wrap gap-2.5 mb-6">
        {aDesIdees ? (
          <>
            <button
              type="button"
              onClick={openSuggestions}
              className="inline-flex items-center gap-2 px-5 py-3 text-[13.5px] font-semibold text-ink bg-type-ai hover:brightness-110 transition"
            >
              <span className="material-symbols-outlined text-[18px]">lightbulb</span>
              Voir les {pendingCount} idée{pendingCount > 1 ? 's' : ''}
            </button>
            <button
              type="button"
              onClick={startAnalysis}
              disabled={analysisRunning}
              className="inline-flex items-center gap-2 px-5 py-3 text-[13.5px] text-bright border-[0.5px] border-line2 hover:bg-elev transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px] text-type-ai">auto_fix</span>
              {analysisRunning ? 'Analyse en cours…' : 'Relancer une analyse'}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={startAnalysis}
            disabled={analysisRunning}
            className="inline-flex items-center gap-2 px-5 py-3 text-[13.5px] font-semibold text-ink bg-type-ai hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[18px]">auto_fix</span>
            {analysisRunning ? 'Analyse en cours…' : LABELS.slavy.analyser}
          </button>
        )}
      </div>

      <div className="flex gap-9 pt-5 hair-t">
        <Stat valeur={documentsTotal} label="documents" />
        <Stat valeur={categories.length} label={categories.length > 1 ? 'dossiers' : 'dossier'} />
        <Stat valeur={pendingCount} label={pendingCount > 1 ? 'idées en attente' : 'idée en attente'} />
        <Stat valeur={`${pourcentEspace} %`} label="de l'espace utilisé" />
      </div>

      <div
        className="absolute top-1/2 right-10 -translate-y-1/2 w-[120px] h-[120px] rounded-full hair flex items-center justify-center"
        style={{ borderColor: "var(--type-ai)", background: "rgba(168,156,214,.06)" }}
      >
        <span className="material-symbols-outlined text-[60px] text-type-ai">smart_toy</span>
      </div>
    </section>
  )
}

function Stat({ valeur, label }: { valeur: number | string; label: string }) {
  return (
    <div>
      <div className="font-display font-semibold text-[24px] tracking-tight tabular-nums">{valeur}</div>
      <div className="text-[12px] text-soft mt-0.5">{label}</div>
    </div>
  )
}

export default HeroSlavy
