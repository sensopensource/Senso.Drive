import { useState, useRef, type ChangeEvent, type DragEvent } from "react"
import { useUploadDocument } from "../hooks/useUploadDocument"
import { useCategories } from "../hooks/useCategories"
import { useToast } from "../contexts/ToastContext"
import { ACCEPT_ATTR, estFormatAccepte, estImage } from "../lib/fileTypes"
import { formatOctets } from "../lib/format"
import TypeIcon from "./TypeIcon"

type Props = {
  onClose: () => void
  defaultCategorie?: number | null
}

type Statut = 'attente' | 'envoi' | 'importe' | 'echec' | 'refuse'

type Entree = {
  id: string
  file: File
  statut: Statut
}

const STATUT_LABEL: Record<Statut, string> = {
  attente: 'en attente',
  envoi:   'envoi…',
  importe: 'importé',
  echec:   'échec',
  refuse:  'refusé',
}

const STATUT_COLOR: Record<Statut, string> = {
  attente: 'text-mute',
  envoi:   'text-type-ai',
  importe: 'text-success',
  echec:   'text-danger',
  refuse:  'text-danger',
}

function extension(file: File): string {
  return file.name.split('.').pop()?.toLowerCase() ?? ''
}

function sansExtension(nom: string): string {
  return nom.replace(/\.[^.]+$/, '')
}

function UploadModal({ onClose, defaultCategorie = null }: Props) {
  const { categories } = useCategories()
  const { uploadDocumentAsync } = useUploadDocument()
  const { showToast } = useToast()

  const [entrees, setEntrees] = useState<Entree[]>([])
  const [idCategorie, setIdCategorie] = useState<number | null>(defaultCategorie)
  const [dragOver, setDragOver] = useState(false)
  const [importing, setImporting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const ajouterFichiers = (fichiers: FileList | null) => {
    if (!fichiers) return
    const nouvelles: Entree[] = Array.from(fichiers).map(file => ({
      id: crypto.randomUUID(),
      file,
      statut: estFormatAccepte(extension(file)) ? 'attente' : 'refuse',
    }))
    setEntrees(prev => [...prev, ...nouvelles])
  }

  const retirer = (id: string) => {
    setEntrees(prev => prev.filter(e => e.id !== id))
  }

  const majStatut = (id: string, statut: Statut) => {
    setEntrees(prev => prev.map(e => (e.id === id ? { ...e, statut } : e)))
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    ajouterFichiers(e.dataTransfer.files)
  }

  const aImporter = entrees.filter(e => e.statut === 'attente' || e.statut === 'echec')
  const refuses = entrees.filter(e => e.statut === 'refuse')

  const importer = async () => {
    if (aImporter.length === 0 || importing) return
    setImporting(true)
    let ok = 0
    let ko = 0
    for (const entree of aImporter) {
      majStatut(entree.id, 'envoi')
      try {
        await uploadDocumentAsync({
          file: entree.file,
          titre: sansExtension(entree.file.name),
          id_categorie: idCategorie,
          silencieux: true,
        })
        majStatut(entree.id, 'importe')
        ok++
      } catch {
        majStatut(entree.id, 'echec')
        ko++
      }
    }
    setImporting(false)
    if (ko === 0) {
      showToast(`${ok} document${ok > 1 ? 's' : ''} importé${ok > 1 ? 's' : ''}`, 'success')
      onClose()
    } else {
      showToast(`${ok} importé${ok > 1 ? 's' : ''}, ${ko} échec${ko > 1 ? 's' : ''}`, 'error')
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/75 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="hair bg-panel w-full max-w-[580px] max-h-[86vh] flex flex-col" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 hair-b">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-type-ai mb-1.5">Importer</div>
            <h2 className="font-display font-semibold text-[20px] tracking-tight">Ajouter des documents</h2>
          </div>
          <button onClick={onClose} className="text-mute hover:text-bright transition-colors" aria-label="Fermer">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Corps */}
        <div className="px-6 py-5 overflow-y-auto">

          {/* Dropzone */}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`w-full border border-dashed px-6 py-8 text-center transition-colors ${
              dragOver ? 'border-type-ai bg-type-ai/[0.07]' : 'border-line2 bg-type-ai/[0.03] hover:border-type-ai hover:bg-type-ai/[0.07]'
            }`}
          >
            <span className="w-12 h-12 rounded-full border-[0.5px] border-type-ai bg-type-ai/10 flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-[24px] text-type-ai">upload_file</span>
            </span>
            <div className="font-display font-semibold text-[14.5px] text-bright">
              Glissez vos fichiers ici, ou <span className="text-type-ai">parcourez votre ordinateur</span>
            </div>
            <div className="text-[12px] text-mute mt-1.5">PDF, Word, images, texte et Markdown</div>
          </button>
          <input ref={inputRef} type="file" multiple accept={ACCEPT_ATTR} className="hidden"
            onChange={(e: ChangeEvent<HTMLInputElement>) => { ajouterFichiers(e.target.files); e.target.value = '' }} />

          {/* File d'attente */}
          {entrees.length > 0 && (
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2.5">
                <span className="section-label text-soft">{entrees.length} fichier{entrees.length > 1 ? 's' : ''}</span>
                {!importing && (
                  <button onClick={() => setEntrees([])} className="text-[11.5px] text-mute hover:text-soft transition-colors">
                    tout retirer
                  </button>
                )}
              </div>

              {entrees.map(entree => {
                const ext = extension(entree.file)
                const refuse = entree.statut === 'refuse'
                return (
                  <div key={entree.id} className="grid grid-cols-[34px_1fr_auto_26px] gap-3 items-center py-2.5 hair-t first:border-t-0">
                    <span className="w-[34px] h-[34px] hair flex items-center justify-center">
                      {refuse
                        ? <span className="material-symbols-outlined text-[17px] text-danger">block</span>
                        : <TypeIcon type={ext} size={17} />}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[13px] text-bright truncate">{entree.file.name}</div>
                      <div className={`font-mono text-[10.5px] mt-0.5 ${refuse ? 'text-danger' : 'text-mute'}`}>
                        {refuse
                          ? `format .${ext} non supporté`
                          : estImage(ext)
                            ? `${formatOctets(entree.file.size)} · Slavy l'analysera après l'import`
                            : formatOctets(entree.file.size)}
                      </div>
                    </div>
                    <span className={`font-mono text-[10px] uppercase tracking-wider whitespace-nowrap ${STATUT_COLOR[entree.statut]}`}>
                      {STATUT_LABEL[entree.statut]}
                    </span>
                    <button
                      onClick={() => retirer(entree.id)}
                      disabled={importing}
                      className="text-mute hover:text-bright transition-colors flex items-center justify-center disabled:opacity-40"
                      aria-label="Retirer"
                    >
                      <span className="material-symbols-outlined text-[16px]">{entree.statut === 'importe' ? 'check_circle' : 'close'}</span>
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Destination */}
          {entrees.length > 0 && (
            <div className="mt-5">
              <label htmlFor="upload-dossier" className="section-label block mb-2">Dossier de destination</label>
              <select
                id="upload-dossier"
                value={idCategorie ?? ''}
                onChange={(e) => setIdCategorie(Number(e.target.value) || null)}
                className="w-full hair bg-transparent text-[12.5px] text-bright px-2.5 py-2 outline-none focus:border-soft transition-colors [&>option]:bg-ink [&>option]:text-bright"
              >
                <option value="">Non classé</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.nom}</option>
                ))}
              </select>
              <p className="text-[11.5px] text-mute mt-2">
                Le titre de chaque document reprend le nom du fichier — vous pourrez le modifier ensuite.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 hair-t flex items-center gap-2.5 mt-auto">
          <span className="text-[12px] text-soft">
            <b className="text-bright font-semibold">{aImporter.length}</b> à importer
            {refuses.length > 0 && ` · ${refuses.length} refusé${refuses.length > 1 ? 's' : ''}`}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button type="button" onClick={onClose} className="btn-ghost">Annuler</button>
            <button
              type="button"
              onClick={importer}
              disabled={aImporter.length === 0 || importing}
              className="btn-primary flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[15px]" style={{ color: '#0b0b0c' }}>upload</span>
              {importing ? 'Import…' : `Importer ${aImporter.length} fichier${aImporter.length > 1 ? 's' : ''}`}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

export default UploadModal
