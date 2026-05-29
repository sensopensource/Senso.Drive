import { useAgent } from "../../contexts/AgentContext"
import { buildTitle } from "../../lib/suggestions"
import { LABELS } from "../../lib/labels"
import type { SuggestionType } from "../../hooks/useSuggestions"

const IDEA_ICON: Record<SuggestionType, string> = {
  regroupement: "drive_file_move",
  suppression:  "content_copy",
  tag:          "sell",
}

// Aperçu éditorial des suggestions Slavy en attente (3 max), avec le « pourquoi ».
function IdeesSlavy() {
  const { suggestions, openSuggestions } = useAgent()
  const enAttente = suggestions.filter(s => s.statut === 'en_attente')
  const apercu = enAttente.slice(0, 3)

  return (
    <section className="hair bg-panel">
      <div className="flex items-end justify-between px-[22px] pt-[18px] pb-3.5">
        <div>
          <h3 className="font-display font-semibold text-[17px] tracking-tight">Les idées de {LABELS.slavy.nom}</h3>
          <div className="text-[12px] text-mute mt-0.5">
            {enAttente.length > 0
              ? `${enAttente.length} suggestion${enAttente.length > 1 ? 's' : ''} à examiner`
              : 'rien à examiner'}
          </div>
        </div>
        {enAttente.length > 0 && (
          <button
            type="button"
            onClick={openSuggestions}
            className="inline-flex items-center gap-1.5 text-[12.5px] text-type-ai hover:brightness-110"
          >
            Tout examiner <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
          </button>
        )}
      </div>

      {apercu.length === 0 ? (
        <div className="px-[22px] py-8 text-center text-[12.5px] text-mute hair-t">
          {LABELS.slavy.nom} n'a rien à proposer pour l'instant.
        </div>
      ) : (
        apercu.map(s => (
          <button
            key={s.id}
            type="button"
            onClick={openSuggestions}
            className="w-full text-left flex gap-3 px-[22px] py-3.5 hair-t hover:bg-elev transition"
          >
            <span
              className="shrink-0 w-[34px] h-[34px] rounded-full flex items-center justify-center"
              style={{ background: "rgba(168,156,214,.1)" }}
            >
              <span className="material-symbols-outlined text-[17px] text-type-ai">{IDEA_ICON[s.type]}</span>
            </span>
            <span className="min-w-0">
              <span className="block text-[13.5px] text-bright leading-snug">{buildTitle(s)}</span>
              <span className="block text-[11.5px] text-mute mt-0.5 truncate">{s.payload.explication}</span>
            </span>
          </button>
        ))
      )}
    </section>
  )
}

export default IdeesSlavy
