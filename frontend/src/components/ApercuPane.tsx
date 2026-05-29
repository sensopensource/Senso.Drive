import { useState, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import type { Components } from "react-markdown"
import { apiFetch } from "../api"
import { estImage } from "../lib/fileTypes"
import { useAnalyserDocument } from "../hooks/useAnalyserDocument"
import PdfCanvas from "./PdfCanvas"
import type { DocumentDetail } from "../types"

type Props = {
  document: DocumentDetail
}

type Apercu = 'pdf' | 'image' | 'texte' | 'aucun'

function genreApercu(type: string | null | undefined): Apercu {
  const t = (type ?? '').toLowerCase()
  if (t === 'pdf') return 'pdf'
  if (estImage(t)) return 'image'
  if (t === 'txt' || t === 'md') return 'texte'
  return 'aucun'
}

// Rendu Markdown lisible sur fond sombre (colonne d'aperçu txt/md).
const MD: Components = {
  h1: ({ children }) => <h2 className="font-display text-[18px] font-semibold text-bright mb-3 mt-1">{children}</h2>,
  h2: ({ children }) => <h2 className="font-display text-[18px] font-semibold text-bright mb-3 mt-1">{children}</h2>,
  h3: ({ children }) => <h3 className="font-display text-[15px] font-semibold text-bright mt-5 mb-2">{children}</h3>,
  p:  ({ children }) => <p className="text-[13.5px] text-soft leading-[1.75] mb-3.5">{children}</p>,
  ul: ({ children }) => <ul className="list-disc pl-5 text-[13.5px] text-soft space-y-1.5 mb-3.5">{children}</ul>,
  li: ({ children }) => <li className="leading-[1.6]">{children}</li>,
  code: ({ children }) => <code className="font-mono text-[12px] bg-elev px-1.5 text-type-md">{children}</code>,
  strong: ({ children }) => <strong className="text-bright font-semibold">{children}</strong>,
}

// Colonne gauche du viewer : aperçu visuel des vrais bytes du document.
// PDF -> canvas (PdfCanvas), image -> <img> + états d'analyse, txt/md -> texte/markdown.
function ApercuPane({ document }: Props) {
  const genre = genreApercu(document.type_fichier)
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [texte, setTexte] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const { mutate: analyser, isPending: isAnalysing } = useAnalyserDocument(document.id)

  // Récupération des bytes via /apercu. Token en header (apiFetch) -> pas de `src` nu :
  // objectURL (blob) pour pdf/image, texte brut pour txt/md.
  useEffect(() => {
    if (genre === 'aucun') return
    let url: string | null = null
    let annule = false

    apiFetch(`/documents/${document.id}/apercu`)
      .then(async (res) => {
        if (!res.ok) throw new Error('apercu indisponible')
        if (genre === 'texte') {
          const contenu = await res.text()
          if (!annule) setTexte(contenu)
        } else {
          const blob = await res.blob()
          url = URL.createObjectURL(blob)
          if (annule) URL.revokeObjectURL(url)
          else setBlobUrl(url)
        }
      })
      .catch(() => { if (!annule) setError(true) })

    return () => {
      annule = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [document.id, genre])

  const ouvrirNouvelOnglet = () => {
    if (blobUrl) window.open(blobUrl, '_blank')
  }

  return (
    <div className="flex-1 min-w-0 bg-[#0a0a0b] relative">

      {genre === 'aucun' && (
        <div className="w-full h-full flex flex-col items-center justify-center gap-3 px-6 text-center">
          <span className="material-symbols-outlined text-mute text-5xl">visibility_off</span>
          <p className="text-[12.5px] text-soft">Aperçu non disponible pour ce format.</p>
        </div>
      )}

      {genre !== 'aucun' && error && (
        <div className="w-full h-full flex flex-col items-center justify-center gap-3 px-6 text-center">
          <span className="material-symbols-outlined text-mute text-5xl">error_outline</span>
          <p className="text-[12.5px] text-soft">Impossible de charger l'aperçu.</p>
        </div>
      )}

      {genre === 'pdf' && !error && blobUrl && (
        <PdfCanvas url={blobUrl} />
      )}

      {genre === 'image' && !error && blobUrl && (
        <div className="w-full h-full flex items-center justify-center p-7 relative">
          <img
            src={blobUrl}
            alt={document.titre}
            onClick={ouvrirNouvelOnglet}
            title="Ouvrir en grand"
            className="max-w-full max-h-full object-contain cursor-zoom-in"
          />
          {document.etat === 'a_analyser' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3.5 bg-ink/70 backdrop-blur-[2px] text-center px-6">
              <span className="w-[54px] h-[54px] rounded-full border-[0.5px] border-type-ai bg-type-ai/10 flex items-center justify-center">
                <span className="w-[18px] h-[18px] rounded-full bg-type-ai animate-pulse" />
              </span>
              <div className="font-display font-semibold text-[15px] text-bright">Slavy lit cette image…</div>
              <div className="text-[12.5px] text-soft max-w-[300px] leading-[1.5]">L'analyse visuelle extrait le texte et décrit le contenu. Ce sera prêt dans un instant.</div>
            </div>
          )}
          {document.etat === 'echec' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3.5 bg-ink/70 backdrop-blur-[2px] text-center px-6">
              <span className="w-[54px] h-[54px] rounded-full border-[0.5px] border-danger bg-danger/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-[28px] text-danger">error</span>
              </span>
              <div className="font-display font-semibold text-[15px] text-bright">L'analyse a échoué</div>
              <div className="text-[12.5px] text-soft max-w-[300px] leading-[1.5]">Slavy n'a pas réussi à lire cette image. Vous pouvez la consulter, ou relancer l'analyse.</div>
              <button
                onClick={() => analyser(undefined)}
                disabled={isAnalysing}
                className="inline-flex items-center gap-2 text-[12.5px] text-bright hair bg-elev px-3.5 py-2 hover:border-danger transition-colors disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                {isAnalysing ? 'Analyse…' : "Relancer l'analyse"}
              </button>
            </div>
          )}
        </div>
      )}

      {genre === 'texte' && !error && texte != null && (
        <div className="w-full h-full overflow-auto p-7">
          <div className="mx-auto max-w-[680px]">
            {document.type_fichier === 'md' ? (
              <ReactMarkdown components={MD}>{texte}</ReactMarkdown>
            ) : (
              <pre className="whitespace-pre-wrap font-mono text-[12.5px] text-soft leading-[1.7]">{texte}</pre>
            )}
          </div>
        </div>
      )}

      {/* Chargement : aucune donnée encore et pas d'erreur. */}
      {genre !== 'aucun' && !error && blobUrl == null && texte == null && (
        <div className="w-full h-full flex items-center justify-center">
          <p className="section-label">Chargement de l'aperçu…</p>
        </div>
      )}

    </div>
  )
}

export default ApercuPane
