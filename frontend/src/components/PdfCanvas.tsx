import { useState, useEffect, useRef } from "react"
import * as pdfjsLib from "pdfjs-dist"
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist"

// Le parsing du PDF tourne dans un web worker (thread separe, ne gele pas l'UI).
// `new URL(..., import.meta.url)` = la maniere Vite-friendly de pointer le worker
// (bundle correctement en dev et en prod, sans suffixe `?url` non type).
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString()

type Props = {
  url: string
}

const PADDING = 56  // p-7 (28px) de chaque cote de la zone de scroll
const LARGEUR_MAX = 900

// Rendu d'un PDF sur <canvas> via pdf.js : on rasterise nous-memes chaque page,
// donc pas de lecteur natif du navigateur (= plus de boite d'impression auto).
function PdfCanvas({ url }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null)
  const [numPages, setNumPages] = useState(0)
  const [page, setPage] = useState(1)
  const [error, setError] = useState(false)

  // 1) Charger le document (une fois par url).
  useEffect(() => {
    let annule = false
    const loadingTask = pdfjsLib.getDocument(url)
    loadingTask.promise
      .then((doc) => {
        if (annule) return
        setPdf(doc)
        setNumPages(doc.numPages)
        setPage(1)
      })
      .catch(() => { if (!annule) setError(true) })
    return () => {
      annule = true
      loadingTask.destroy()
    }
  }, [url])

  // 2) Rendre la page courante. Le rendu est asynchrone et annulable :
  // si on change de page ou qu'on demonte en plein rendu, on annule (renderTask.cancel()).
  useEffect(() => {
    if (!pdf) return
    let annule = false
    let renderTask: RenderTask | null = null

    pdf.getPage(page).then((p) => {
      if (annule) return
      const canvas = canvasRef.current
      const wrap = wrapRef.current
      if (!canvas || !wrap) return
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // Echelle = on ajuste la page a la largeur dispo (plafonnee).
      const base = p.getViewport({ scale: 1 })
      const cible = Math.min(wrap.clientWidth - PADDING, LARGEUR_MAX)
      const scale = cible > 0 ? cible / base.width : 1
      const viewport = p.getViewport({ scale })

      // Deux tailles distinctes : le buffer de pixels (canvas.width/height) est
      // multiplie par devicePixelRatio pour rester net sur ecran retina ; la taille
      // CSS reste celle du viewport. Le `transform` met le dessin a la meme echelle.
      const ratio = window.devicePixelRatio || 1
      canvas.width = Math.floor(viewport.width * ratio)
      canvas.height = Math.floor(viewport.height * ratio)
      canvas.style.width = `${Math.floor(viewport.width)}px`
      canvas.style.height = `${Math.floor(viewport.height)}px`
      const transform = ratio !== 1 ? [ratio, 0, 0, ratio, 0, 0] : undefined

      renderTask = p.render({ canvas, canvasContext: ctx, viewport, transform })
      renderTask.promise.catch(() => { /* annulation -> rejette, on ignore */ })
    })

    return () => {
      annule = true
      renderTask?.cancel()
    }
  }, [pdf, page])

  const pagePrecedente = () => setPage((p) => Math.max(1, p - 1))
  const pageSuivante = () => setPage((p) => Math.min(numPages, p + 1))

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-[12.5px] text-soft">Impossible d'afficher ce PDF.</p>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative">
      <div ref={wrapRef} className="absolute inset-0 overflow-auto p-7 flex justify-center">
        {!pdf && (
          <p className="section-label self-center">Préparation du document…</p>
        )}
        <canvas ref={canvasRef} className="self-start block shadow-2xl" />
      </div>

      {numPages > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-3 bg-elev hair px-3 py-1.5 font-mono text-[10.5px] text-soft">
          <button
            onClick={pagePrecedente}
            disabled={page <= 1}
            className="text-mute hover:text-bright disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Page précédente"
          >
            <span className="material-symbols-outlined text-[15px]">chevron_left</span>
          </button>
          page {page} / {numPages}
          <button
            onClick={pageSuivante}
            disabled={page >= numPages}
            className="text-mute hover:text-bright disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Page suivante"
          >
            <span className="material-symbols-outlined text-[15px]">chevron_right</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default PdfCanvas
