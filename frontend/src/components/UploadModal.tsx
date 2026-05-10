import { useState, type ChangeEvent, type FormEvent } from "react"
import { useUploadDocument } from "../hooks/useUploadDocument"
import { useCategories } from "../hooks/useCategories"

type Props = {
  onClose: () => void
}

function UploadModal({ onClose }: Props) {
  const { categories } = useCategories()
  const { uploadDocument, isPending, error } = useUploadDocument()

  const [file, setFile] = useState<File | null>(null)
  const [titre, setTitre] = useState('')
  const [auteur, setAuteur] = useState('')
  const [idCategorie, setIdCategorie] = useState<number | null>(null)

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null
    setFile(selected)
    if (selected && !titre) {
      const sansExt = selected.name.replace(/\.[^.]+$/, '')
      setTitre(sansExt)
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!file) return

    uploadDocument(
      { file, titre, auteur, id_categorie: idCategorie },
      { onSuccess: () => onClose() }
    )
  }

  return (
    <div
      className="fixed inset-0 bg-ink/75 z-50 flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div
        className="hair bg-panel w-full max-w-[440px]"
        onClick={(e) => e.stopPropagation()}
      >

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 hair-b">
          <div>
            <div className="text-[10.5px] font-mono text-mute uppercase tracking-wider">
              Archive
            </div>
            <h2 className="text-[15px] text-bright mt-0.5">
              Uploader un document
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center text-mute hover:text-bright transition-colors"
            aria-label="Fermer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">

          {/* Fichier */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="upload-file"
              className="text-[10.5px] font-mono text-mute uppercase tracking-wider"
            >
              Fichier
            </label>
            <input
              id="upload-file"
              type="file"
              accept=".pdf,.docx,.txt,.md"
              onChange={handleFileChange}
              className="hair bg-transparent text-[12.5px] text-bright px-2.5 py-2 outline-none file:bg-elev file:text-soft file:border-0 file:px-2.5 file:py-1 file:mr-3 file:font-mono file:text-[10.5px] file:uppercase file:tracking-wider file:cursor-pointer hover:file:text-bright"
            />
            {file && (
              <p className="text-[11px] font-mono text-mute mt-0.5">
                {file.name} · {(file.size / 1024).toFixed(1)} Ko
              </p>
            )}
          </div>

          {/* Catégorie */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="upload-categorie"
              className="text-[10.5px] font-mono text-mute uppercase tracking-wider"
            >
              Catégorie
            </label>
            <select
              id="upload-categorie"
              value={idCategorie ?? ''}
              onChange={(e) => setIdCategorie(Number(e.target.value) || null)}
              className="hair bg-transparent text-[12.5px] text-bright px-2.5 py-2 outline-none focus:border-soft transition-colors [&>option]:bg-ink [&>option]:text-bright"
            >
              <option value="">Aucune (Non classé)</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nom}</option>
              ))}
            </select>
          </div>

          {/* Titre */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="upload-titre"
              className="text-[10.5px] font-mono text-mute uppercase tracking-wider"
            >
              Titre
            </label>
            <input
              id="upload-titre"
              type="text"
              value={titre}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setTitre(e.target.value)}
              placeholder="Titre du document"
              autoComplete="off"
              className="hair bg-transparent text-[12.5px] text-bright px-2.5 py-2 outline-none focus:border-soft transition-colors placeholder:text-mute"
            />
          </div>

          {/* Auteur */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="upload-auteur"
              className="text-[10.5px] font-mono text-mute uppercase tracking-wider"
            >
              Auteur
            </label>
            <input
              id="upload-auteur"
              type="text"
              value={auteur}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setAuteur(e.target.value)}
              placeholder="Optionnel"
              autoComplete="off"
              className="hair bg-transparent text-[12.5px] text-bright px-2.5 py-2 outline-none focus:border-soft transition-colors placeholder:text-mute"
            />
          </div>

          {/* Erreur */}
          {error && (
            <p className="text-[11.5px] text-[var(--color-danger-raw)] font-mono">
              {error.message}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!file || isPending}
              className="btn-primary flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[15px]" style={{ color: '#0b0b0c' }}>upload</span>
              {isPending ? 'Envoi...' : 'Uploader'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}

export default UploadModal
