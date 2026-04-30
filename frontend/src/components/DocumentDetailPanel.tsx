import { useState, useRef, useEffect, type ChangeEvent, type KeyboardEvent } from "react"
import { useDocument } from "../hooks/useDocument"
import { useDeleteDocument } from "../hooks/useDeleteDocument"
import { useUpdateDocument } from "../hooks/useUpdateDocument"
import { useTags } from "../hooks/useTags"
import { useCreateTag } from "../hooks/useCreateTag"
import { useUpdateDocumentTags } from "../hooks/useUpdateDocumentTags"
import { TagChip } from "./TagChip"

type Props = {
  documentId: number | null
  onClose: () => void
}

const TYPE_COLORS: Record<string, string> = {
  pdf:  "text-pdf",
  docx: "text-docx",
  txt:  "text-txt",
  md:   "text-md",
}

const TYPE_ICONS: Record<string, string> = {
  pdf:  "picture_as_pdf",
  docx: "description",
  txt:  "text_snippet",
  md:   "article",
}

function DocumentDetailPanel({ documentId, onClose }: Props) {
  const { document, isLoading, error } = useDocument(documentId)
  const { deleteDocument, isPending } = useDeleteDocument()
  const { updateDocument } = useUpdateDocument()
  const { data: allTags } = useTags()
  const { mutate: createTag, isPending: isCreatingTag } = useCreateTag()
  const { mutate: updateDocumentTags } = useUpdateDocumentTags(documentId || 0)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editTitre, setEditTitre] = useState(false)
  const [titreValue, setTitreValue] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [showTagSuggestions, setShowTagSuggestions] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const tagPickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showTagSuggestions) return
    const handleClickOutside = (e: MouseEvent) => {
      if (tagPickerRef.current && !tagPickerRef.current.contains(e.target as Node)) {
        setShowTagSuggestions(false)
      }
    }
    window.document.addEventListener('mousedown', handleClickOutside)
    return () => window.document.removeEventListener('mousedown', handleClickOutside)
  }, [showTagSuggestions])

  useEffect(() => {
    setHighlightedIndex(0)
  }, [tagInput])

  const handleStartEdit = () => {
    if (!document) return
    setTitreValue(document.titre)
    setEditTitre(true)
  }

  const handleSaveTitre = () => {
    if (!documentId || !titreValue.trim()) {
      setEditTitre(false)
      return
    }
    if (titreValue.trim() === document?.titre) {
      // Pas de changement, on ferme juste
      setEditTitre(false)
      return
    }
    updateDocument(
      { id: documentId, titre: titreValue.trim() },
      { onSuccess: () => setEditTitre(false) }
    )
  }

  const handleCancelEdit = () => {
    setEditTitre(false)
  }

  const handleDelete = () => {
    if (!documentId) return
    deleteDocument(documentId, {
      onSuccess: () => {
        setConfirmDelete(false)
        onClose()
      },
    })
  }

  const handleDownload = async () => {
    if (!documentId) return
    // Le download est un fichier binaire, pas du JSON, donc on utilise fetch direct
    const token = localStorage.getItem('token')
    const response = await fetch(`http://localhost:8000/documents/${documentId}/download`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    if (!response.ok) return

    // On recupere le nom de fichier depuis le header Content-Disposition
    const disposition = response.headers.get('content-disposition') || ''
    const match = disposition.match(/filename="?([^";]+)"?/)
    const filename = match ? match[1] : `document-${documentId}`

    // On telecharge le blob
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = window.document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleAddTag = (tagId: number) => {
    if (!document) return
    const currentTagIds = document.tags.map(t => t.id)
    if (!currentTagIds.includes(tagId)) {
      updateDocumentTags([...currentTagIds, tagId])
    }
    setTagInput('')
    setShowTagSuggestions(false)
  }

  const handleRemoveTag = (tagId: number) => {
    if (!document) return
    const currentTagIds = document.tags.map(t => t.id).filter(id => id !== tagId)
    updateDocumentTags(currentTagIds)
  }

  const handleCreateAndAddTag = () => {
    const name = tagInput.trim()
    if (!name || isCreatingTag) return
    createTag(name, {
      onSuccess: (newTag) => {
        if (!document) return
        const currentTagIds = document.tags.map(t => t.id)
        if (!currentTagIds.includes(newTag.id)) {
          updateDocumentTags([...currentTagIds, newTag.id])
        }
        setTagInput('')
        setShowTagSuggestions(false)
      }
    })
  }

  const filteredSuggestions = (allTags || []).filter(
    tag => tag.name.toLowerCase().includes(tagInput.toLowerCase()) &&
           !document?.tags.some(t => t.id === tag.id)
  ).slice(0, 6)

  const exactMatch = filteredSuggestions.find(
    t => t.name.toLowerCase() === tagInput.trim().toLowerCase()
  )
  const canCreate = tagInput.trim().length > 0 && !exactMatch

  const handleTagInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setShowTagSuggestions(false)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const max = filteredSuggestions.length + (canCreate ? 1 : 0) - 1
      setHighlightedIndex(i => Math.min(i + 1, max))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex(i => Math.max(i - 1, 0))
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightedIndex < filteredSuggestions.length) {
        handleAddTag(filteredSuggestions[highlightedIndex].id)
      } else if (canCreate) {
        handleCreateAndAddTag()
      }
    }
  }

  // Format de la date en YYYY-MM-DD HH:MM (style design system)
  const formatDate = (iso: string | null | undefined) => {
    if (!iso) return '—'
    const d = new Date(iso)
    const date = d.toISOString().slice(0, 10)
    const time = d.toISOString().slice(11, 16)
    return `${date} ${time}`
  }

  const typeColor = document?.type_fichier ? TYPE_COLORS[document.type_fichier] ?? "text-fg-3" : "text-fg-3"
  const typeIcon = document?.type_fichier ? TYPE_ICONS[document.type_fichier] ?? "insert_drive_file" : "insert_drive_file"

  return (
    // Overlay transparent qui ferme au clic
    <div
      className="fixed inset-0 z-40"
      onClick={onClose}
    >
      {/* Le panel lui-meme — stopPropagation pour eviter de fermer */}
      <aside
        onClick={(e) => e.stopPropagation()}
        className="fixed top-0 right-0 h-full w-full max-w-md bg-surface-1 border-l border-border shadow-panel flex flex-col"
      >

        {/* Header du panel */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border">
          <div className="font-mono text-xs uppercase tracking-wider text-fg-3">
            Détail document
          </div>
          <button
            onClick={onClose}
            className="text-fg-3 hover:text-fg-1 transition-colors"
            aria-label="Fermer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto p-6">

          {isLoading && (
            <p className="font-mono text-xs uppercase tracking-wider text-fg-3 text-center mt-12">
              Chargement...
            </p>
          )}

          {error && (
            <div className="text-center mt-12">
              <span className="material-symbols-outlined text-danger text-5xl mb-3 block">
                error_outline
              </span>
              <p className="font-body text-sm text-fg-2">
                Impossible de charger ce document.
              </p>
            </div>
          )}

          {document && (
            <>
              {/* Titre + icone */}
              <div className="flex items-start gap-3 mb-6">
                <span className={`material-symbols-outlined text-3xl ${typeColor}`}>
                  {typeIcon}
                </span>
                <div className="flex-1 min-w-0">

                  {editTitre ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={titreValue}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setTitreValue(e.target.value)}
                        autoFocus
                        className="flex-1 bg-base border border-border-fg-3 text-fg-1 px-2 py-1 text-sm font-body focus:outline-none focus:border-primary"
                      />
                      <button
                        onClick={handleSaveTitre}
                        className="flex items-center justify-center bg-surface-3 border border-success text-success w-8 h-8 hover:bg-surface-2 transition-colors text-lg leading-none"
                        aria-label="Valider"
                      >
                        ✓
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex items-center justify-center bg-surface-3 border border-danger text-danger w-8 h-8 hover:bg-surface-2 transition-colors text-lg leading-none"
                        aria-label="Annuler"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <h2 className="font-display text-xl text-fg-1 break-words flex-1">
                        {document.titre}
                      </h2>
                      <button
                        onClick={handleStartEdit}
                        className="flex items-center justify-center bg-surface-2 border border-border-fg-3 text-fg-2 w-7 h-7 hover:bg-surface-3 hover:text-fg-1 transition-colors mt-1 shrink-0"
                        aria-label="Renommer"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                    </div>
                  )}

                  {document.auteur && (
                    <p className="font-mono text-xs text-fg-3 mt-1">
                      {document.auteur}
                    </p>
                  )}
                </div>
              </div>

              {/* Métadonnées */}
              <div className="bg-base border border-border p-4 space-y-2 mb-6">
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-fg-3 uppercase tracking-wider">Type</span>
                  <span className={`uppercase ${typeColor}`}>{document.type_fichier ?? '—'}</span>
                </div>
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-fg-3 uppercase tracking-wider">Version</span>
                  <span className="text-fg-2">v{document.numero_version ?? '?'}</span>
                </div>
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-fg-3 uppercase tracking-wider">Créé le</span>
                  <span className="text-fg-2">{formatDate(document.date_creation)}</span>
                </div>
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-fg-3 uppercase tracking-wider">Uploadé le</span>
                  <span className="text-fg-2">{formatDate(document.date_upload)}</span>
                </div>
              </div>

              {/* Tags */}
              <div className="mb-6">
                <div className="font-mono text-xs uppercase tracking-wider text-fg-3 mb-3">
                  Tags
                </div>

                {/* Liste des tags courants */}
                {document.tags && document.tags.length > 0 && (
                  <div className="flex gap-1.5 mb-3 flex-wrap">
                    {document.tags.map((tag) => (
                      <TagChip
                        key={tag.id}
                        tag={tag}
                        removable
                        onRemove={() => handleRemoveTag(tag.id)}
                      />
                    ))}
                  </div>
                )}

                {/* Input pour ajouter un tag */}
                <div className="relative" ref={tagPickerRef}>
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onFocus={() => setShowTagSuggestions(true)}
                    onKeyDown={handleTagInputKeyDown}
                    disabled={isCreatingTag}
                    placeholder="Ajouter un tag..."
                    className="w-full bg-base border border-border text-fg-1 px-3 py-2 text-sm font-body focus:outline-none focus:border-primary disabled:opacity-60"
                  />

                  {showTagSuggestions && (filteredSuggestions.length > 0 || canCreate) && (
                    <div className="absolute top-full left-0 right-0 bg-surface-2 border border-border mt-1 z-50">
                      {filteredSuggestions.map((tag, idx) => (
                        <button
                          key={tag.id}
                          type="button"
                          onMouseEnter={() => setHighlightedIndex(idx)}
                          onClick={() => handleAddTag(tag.id)}
                          className={`w-full text-left px-3 py-2 text-sm font-body text-fg-1 flex items-center gap-2 transition-colors ${
                            highlightedIndex === idx ? 'bg-surface-3' : ''
                          }`}
                        >
                          <span
                            className="w-2 h-2 inline-block"
                            style={{ backgroundColor: tag.color }}
                          />
                          {tag.name}
                        </button>
                      ))}

                      {canCreate && (
                        <button
                          type="button"
                          onMouseEnter={() => setHighlightedIndex(filteredSuggestions.length)}
                          onClick={handleCreateAndAddTag}
                          disabled={isCreatingTag}
                          className={`w-full text-left px-3 py-2 text-xs font-mono uppercase tracking-wider text-fg-2 border-t border-border transition-colors disabled:opacity-50 ${
                            highlightedIndex === filteredSuggestions.length ? 'bg-surface-3 text-fg-1' : ''
                          }`}
                        >
                          {isCreatingTag ? 'Création…' : `+ Créer "${tagInput.trim()}"`}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Aperçu du contenu */}
              {document.apercu_contenu && (
                <div className="mb-6">
                  <div className="font-mono text-xs uppercase tracking-wider text-fg-3 mb-2">
                    Aperçu
                  </div>
                  <div className="bg-base border border-border p-4 font-body text-sm text-fg-2 max-h-48 overflow-y-auto whitespace-pre-wrap">
                    {document.apercu_contenu}
                  </div>
                </div>
              )}

              {/* Résumé LLM (si dispo) */}
              {document.resume_llm && (
                <div className="mb-6">
                  <div className="font-mono text-xs uppercase tracking-wider text-ai mb-2 flex items-center gap-1">
                    <span className="material-symbols-outlined text-base">auto_awesome</span>
                    Résumé IA
                  </div>
                  <div className="bg-base border border-border p-4 font-body text-sm text-fg-1">
                    {document.resume_llm}
                  </div>
                </div>
              )}
            </>
          )}

        </div>

        {/* Footer avec actions */}
        {document && (
          <div className="border-t border-border p-4 space-y-2">
            <button
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 bg-primary text-fg-inverse font-body font-semibold py-2 text-sm hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-base">download</span>
              Télécharger
            </button>

            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full flex items-center justify-center gap-2 border border-border text-fg-2 font-body py-2 text-sm hover:border-danger hover:text-danger transition-colors"
              >
                <span className="material-symbols-outlined text-base">delete</span>
                Supprimer
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 font-mono text-xs uppercase tracking-wider text-fg-3 hover:text-fg-1 transition-colors py-2"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isPending}
                  className="flex-1 flex items-center justify-center gap-1 bg-danger text-fg-1 font-body py-2 text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-base">delete_forever</span>
                  {isPending ? 'Suppression...' : 'Confirmer'}
                </button>
              </div>
            )}
          </div>
        )}

      </aside>
    </div>
  )
}

export default DocumentDetailPanel
