import { useEffect, useRef, useState, type ReactNode } from "react"
import type { Document } from "../../types"
import { apiFetch } from "../../api"
import { estImage } from "../../lib/fileTypes"
import { useInView } from "../../hooks/useInView"
import { renderPremierePage } from "../../lib/pdfThumb"
import TypeIcon from "../TypeIcon"
import SelectableIcon from "./SelectableIcon"

type Props = {
  document: Document
  checked: boolean
  onToggle: () => void
}

type Genre = 'image' | 'pdf' | 'texte' | 'page'

function genreDe(type: string): Genre {
  if (estImage(type)) return 'image'
  if (type === 'pdf') return 'pdf'
  if (type === 'md' || type === 'txt') return 'texte'
  return 'page'
}

// Fausse page claire (pdf en chargement / docx / inconnu) — pas de vrai rendu.
function FauxPage({ doc = false }: { doc?: boolean }) {
  return (
    <div className={`pg${doc ? ' pg-doc' : ''}`}>
      <span className="ln t" />
      <span className="ln" />
      <span className="ln" />
      <span className="ln s" />
      <span className="ln" />
      <span className="ln s" />
    </div>
  )
}

// Vignette = aperçu réel des bytes (image, 1re page PDF, extrait txt/md), chargé en
// lazy-load quand la carte entre dans le viewport. Faux rendu stylisé en attendant.
function DocThumb({ document, checked, onToggle }: Props) {
  const [ref, inView] = useInView<HTMLDivElement>()
  const type = (document.type_fichier ?? '').toLowerCase()
  const genre = genreDe(type)
  const imageEnAttente = genre === 'image' && (document.etat === 'a_analyser' || document.etat === 'echec')

  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [lignes, setLignes] = useState<string[] | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const aCharger = inView && !imageEnAttente && (genre === 'image' || genre === 'pdf' || genre === 'texte')

  useEffect(() => {
    if (!aCharger) return
    let annule = false
    let url: string | null = null

    apiFetch(`/documents/${document.id}/apercu`)
      .then(async (res) => {
        if (!res.ok) throw new Error('apercu indisponible')
        if (genre === 'texte') {
          const t = await res.text()
          if (!annule) setLignes(t.split('\n').map((l) => l.replace(/\s+$/, '')).filter((l) => l.length).slice(0, 6))
        } else {
          const blob = await res.blob()
          url = URL.createObjectURL(blob)
          if (annule) URL.revokeObjectURL(url)
          else setBlobUrl(url)
        }
      })
      .catch(() => { /* on garde le faux rendu */ })

    return () => {
      annule = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [aCharger, document.id, genre])

  // Rendu de la 1re page du PDF une fois le blob récupéré.
  useEffect(() => {
    if (genre !== 'pdf' || !blobUrl || !canvasRef.current) return
    return renderPremierePage(blobUrl, canvasRef.current, 190)
  }, [genre, blobUrl])

  let contenu: ReactNode
  if (genre === 'image') {
    if (document.etat === 'a_analyser')
      contenu = <div className="thumb-img analyzing"><span className="shimmer" /><span className="an-label">Slavy analyse l'image…</span></div>
    else if (document.etat === 'echec')
      contenu = <div className="thumb-img echec"><span className="an-label err">Analyse échouée</span></div>
    else if (blobUrl)
      contenu = <img src={blobUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
    else
      contenu = <div className="thumb-img" />
  } else if (genre === 'pdf') {
    contenu = blobUrl
      ? <div className="absolute inset-0 bg-[#ececef] overflow-hidden"><canvas ref={canvasRef} className="block w-full" /></div>
      : <FauxPage />
  } else if (genre === 'texte') {
    contenu = lignes
      ? <div className="thumb-md">{lignes.map((l, i) => <span key={i} className={`cl${type === 'md' && i === 0 ? ' h' : ''}`}>{l}</span>)}</div>
      : <FauxPage />
  } else {
    contenu = <FauxPage doc={type === 'docx'} />
  }

  return (
    <div ref={ref} className="doc-thumb">
      <span className="badge-type">
        <SelectableIcon checked={checked} onToggle={onToggle} size={14}>
          <TypeIcon type={document.type_fichier} size={14} />
        </SelectableIcon>
      </span>
      <span className="grab">
        <span className="material-symbols-outlined">drag_indicator</span>
      </span>
      {contenu}
    </div>
  )
}

export default DocThumb
