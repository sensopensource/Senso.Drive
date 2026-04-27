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
    // Pré-remplit le titre avec le nom du fichier (sans l'extension)
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
    // Overlay sombre + clic ferme
    <div
      className="fixed inset-0 bg-overlay z-50 flex items-center justify-center px-4"
      onClick={onClose}
    >

      {/* Carte modal — stopPropagation empêche le clic interne de fermer */}
      <div
        className="bg-surface-2 border border-border w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >

        {/* Header du modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <div className="font-mono text-xs uppercase tracking-wider text-fg-3">
              Archive
            </div>
            <h2 className="font-display text-lg text-fg-1 mt-1">
              Uploader un document
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-fg-3 hover:text-fg-1 transition-colors"
            aria-label="Fermer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Fichier */}
          <div>
            <label
              htmlFor="upload-file"
              className="block font-mono text-xs uppercase tracking-wider text-fg-3 mb-1.5"
            >
              Fichier
            </label>
            <input
              id="upload-file"
              type="file"
              accept=".pdf,.docx,.txt,.md"
              onChange={handleFileChange}
              className="w-full bg-base border border-border text-fg-1 px-3 py-2 text-sm font-body file:bg-surface-1 file:text-fg-2 file:border-0 file:px-3 file:py-1 file:mr-3 file:font-mono file:text-xs file:uppercase file:tracking-wider file:cursor-pointer"
            />
            {file && (
              <p className="font-mono text-xs text-fg-3 mt-1.5">
                {file.name} · {(file.size / 1024).toFixed(1)} Ko
              </p>
            )}
          </div>

          {/* Catégorie */}
          <div>
            <label
              htmlFor="upload-categorie"
              className="block font-mono text-xs uppercase tracking-wider text-fg-3 mb-1.5"
            >
              Catégorie
            </label>
            <select
              id="upload-categorie"
              value={idCategorie ?? ''}
              onChange={(e) => setIdCategorie(Number(e.target.value) || null)}
              className="w-full bg-base border border-border text-fg-1 px-3 py-2 text-sm font-body focus:outline-none focus:border-primary"
            >
              <option value="">Aucune (Non classé)</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nom}</option>
              ))}
            </select>
          </div>

          {/* Titre (optionnel) */}
          <div>
            <label
              htmlFor="upload-titre"
              className="block font-mono text-xs uppercase tracking-wider text-fg-3 mb-1.5"
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
              className="w-full bg-base border border-border text-fg-1 px-3 py-2 text-sm font-body focus:outline-none focus:border-primary"
            />
          </div>

          {/* Auteur (optionnel) */}
          <div>
            <label
              htmlFor="upload-auteur"
              className="block font-mono text-xs uppercase tracking-wider text-fg-3 mb-1.5"
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
              className="w-full bg-base border border-border text-fg-1 px-3 py-2 text-sm font-body focus:outline-none focus:border-primary"
            />
          </div>

          {/* Erreur éventuelle */}
          {error && (
            <p className="text-danger text-sm font-body">
              {error.message}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="font-mono text-xs uppercase tracking-wider text-fg-3 hover:text-fg-1 transition-colors px-3 py-2"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!file || isPending}
              className="flex items-center gap-2 bg-primary text-fg-inverse font-body font-semibold px-4 py-2 text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-base">upload</span>
              {isPending ? 'Envoi...' : 'Uploader'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}

export default UploadModal
