import * as pdfjsLib from "pdfjs-dist"
import type { RenderTask } from "pdfjs-dist"

// Worker pdf.js (thread separe). Meme config que PdfCanvas ; idempotent si les deux
// modules sont charges. `new URL(..., import.meta.url)` = resolution Vite (dev + prod).
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString()

// Rend la 1re page d'un PDF sur un petit canvas (vignette). Renvoie une fonction
// d'annulation (demontage / changement d'url en plein rendu).
export function renderPremierePage(url: string, canvas: HTMLCanvasElement, largeurCible: number): () => void {
  let annule = false
  let renderTask: RenderTask | null = null
  const loadingTask = pdfjsLib.getDocument(url)

  loadingTask.promise
    .then((doc) => doc.getPage(1))
    .then((page) => {
      if (annule) return
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const base = page.getViewport({ scale: 1 })
      const scale = largeurCible / base.width
      const viewport = page.getViewport({ scale })

      // Buffer de pixels x devicePixelRatio (net sur retina) ; taille CSS = 100% du conteneur.
      const ratio = window.devicePixelRatio || 1
      canvas.width = Math.floor(viewport.width * ratio)
      canvas.height = Math.floor(viewport.height * ratio)
      const transform = ratio !== 1 ? [ratio, 0, 0, ratio, 0, 0] : undefined

      renderTask = page.render({ canvas, canvasContext: ctx, viewport, transform })
      renderTask.promise.catch(() => { /* annulation -> rejette, on ignore */ })
    })
    .catch(() => { /* PDF illisible -> on garde la fausse page */ })

  return () => {
    annule = true
    renderTask?.cancel()
    loadingTask.destroy()
  }
}
