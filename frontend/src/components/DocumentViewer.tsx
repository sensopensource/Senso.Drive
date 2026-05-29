import { useState, useRef, useEffect, type ChangeEvent, type KeyboardEvent } from "react"
import { useDocument } from "../hooks/useDocument"
import { useDeleteDocument } from "../hooks/useDeleteDocument"
import { useUpdateDocument } from "../hooks/useUpdateDocument"
import { useTags } from "../hooks/useTags"
import { useCreateTag } from "../hooks/useCreateTag"
import { useUpdateDocumentTags } from "../hooks/useUpdateDocumentTags"
import { useCategories } from "../hooks/useCategories"
import { useAnalyserDocument } from "../hooks/useAnalyserDocument"
import { useAddVersion } from "../hooks/useAddVersion"
import { useVersions } from "../hooks/useVersions"
import ReactMarkdown from "react-markdown"
import type { Components } from "react-markdown"
import { apiFetch } from "../api"
import { LABELS } from "../lib/labels"
import { fileTypeMeta } from "../lib/fileTypes"
import { formatOctets } from "../lib/format"
import ApercuPane from "./ApercuPane"
import TypeIcon from "./TypeIcon"

type Props = {
  documentId: number
  onClose: () => void
}

const TYPE_DOTS = ["bg-type-pdf", "bg-type-docx", "bg-type-txt", "bg-type-md", "bg-type-ai"]

// Rendu Markdown compact (rail : résumé Slavy).
const MD_RESUME: Components = {
  p:  ({ children }) => <p className="text-[12.5px] text-soft leading-[1.65] mb-2">{children}</p>,
  h1: ({ children }) => <h2 className="text-[13px] text-bright font-semibold mb-2 mt-3">{children}</h2>,
  h2: ({ children }) => <h2 className="text-[13px] text-bright font-semibold mb-2 mt-3">{children}</h2>,
  h3: ({ children }) => <h3 className="text-[12px] text-bright font-medium mb-1 mt-2">{children}</h3>,
  ul: ({ children }) => <ul className="list-disc list-inside text-[12.5px] text-soft space-y-1 mb-2">{children}</ul>,
  li: ({ children }) => <li className="leading-[1.65]">{children}</li>,
  strong: ({ children }) => <strong className="text-bright font-semibold">{children}</strong>,
}

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  })
}

// Vue document plein écran (overlay 2 colonnes) : aperçu visuel à gauche, fiche
// d'édition complète à droite. Remplace l'ancien panneau latéral.
function DocumentViewer({ documentId, onClose }: Props) {
  const { document, isLoading, error } = useDocument(documentId)
  const { deleteDocument, isPending: isDeleting } = useDeleteDocument()
  const { updateDocument } = useUpdateDocument()
  const { categories } = useCategories()
  const { data: allTags } = useTags()
  const { mutate: createTag, isPending: isCreatingTag } = useCreateTag()
  const { mutate: updateDocumentTags } = useUpdateDocumentTags(documentId)
  const { mutate: analyserDocument, isPending: isAnalysing } = useAnalyserDocument(documentId)
  const { mutate: addVersion, isPending: isUploading } = useAddVersion(documentId)
  const { versions } = useVersions(documentId)
  const versionInputRef = useRef<HTMLInputElement>(null)
  const [selectedVersionNumero, setSelectedVersionNumero] = useState<number | null>(null)

  const latestVersion = versions[0]
  const displayedVersion = selectedVersionNumero != null
    ? versions.find(v => v.numero === selectedVersionNumero) ?? latestVersion
    : latestVersion
  const isViewingArchived = displayedVersion && latestVersion && displayedVersion.numero !== latestVersion.numero

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [resumeOuvert, setResumeOuvert] = useState(false)
  const [editTitre, setEditTitre] = useState(false)
  const [titreValue, setTitreValue] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [showTagSuggestions, setShowTagSuggestions] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const tagPickerRef = useRef<HTMLDivElement>(null)
  const [showCategoriePicker, setShowCategoriePicker] = useState(false)
  const categoriePickerRef = useRef<HTMLDivElement>(null)

  // Fermeture au clavier (Echap).
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

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
    if (!showCategoriePicker) return
    const handleClickOutside = (e: MouseEvent) => {
      if (categoriePickerRef.current && !categoriePickerRef.current.contains(e.target as Node)) {
        setShowCategoriePicker(false)
      }
    }
    window.document.addEventListener('mousedown', handleClickOutside)
    return () => window.document.removeEventListener('mousedown', handleClickOutside)
  }, [showCategoriePicker])

  const handleChangeCategorie = (newCategorieId: number) => {
    if (!document) return
    setShowCategoriePicker(false)
    if (newCategorieId === document.id_categorie) return
    const newNom = categories.find(c => c.id === newCategorieId)?.nom ?? '?'
    updateDocument({
      id: documentId,
      id_categorie: newCategorieId,
      successMessage: `Document déplacé dans "${newNom}"`,
    })
  }

  const handleStartEdit = () => {
    if (!document) return
    setTitreValue(document.titre)
    setEditTitre(true)
  }

  const handleSaveTitre = () => {
    if (!titreValue.trim() || titreValue.trim() === document?.titre) {
      setEditTitre(false)
      return
    }
    updateDocument(
      { id: documentId, titre: titreValue.trim() },
      { onSuccess: () => setEditTitre(false) }
    )
  }

  const handleVersionChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    addVersion(file)
    e.target.value = ''
  }

  const handleDelete = () => {
    deleteDocument(documentId, {
      onSuccess: () => {
        setConfirmDelete(false)
        onClose()
      },
    })
  }

  const handleDownload = async () => {
    const path = displayedVersion && isViewingArchived
      ? `/documents/${documentId}/versions/${displayedVersion.numero}/download`
      : `/documents/${documentId}/download`

    const response = await apiFetch(path)
    if (!response.ok) return
    const disposition = response.headers.get('content-disposition') || ''
    const match = disposition.match(/filename="?([^";]+)"?/)
    const filename = match ? match[1] : `document-${documentId}`
    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)
    const a = window.document.createElement('a')
    a.href = blobUrl
    a.download = filename
    a.click()
    URL.revokeObjectURL(blobUrl)
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
    if (e.key === 'Escape') return setShowTagSuggestions(false)
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

  const meta = fileTypeMeta(document?.type_fichier)
  const categorieNom = document?.id_categorie
    ? categories.find(c => c.id === document.id_categorie)?.nom ?? null
    : null
  const categorieIdx = categorieNom
    ? categories.findIndex(c => c.id === document?.id_categorie)
    : -1

  const morceauxMeta: string[] = [meta.label]
  if (document?.numero_version != null) morceauxMeta.push(`v${document.numero_version}`)
  if (document?.taille_octets != null) morceauxMeta.push(formatOctets(document.taille_octets))
  if (document?.auteur) morceauxMeta.push(document.auteur)
  const ligneMeta = morceauxMeta.join(' · ')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 sm:p-10"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[1080px] h-[84vh] bg-panel hair flex flex-col overflow-hidden shadow-2xl"
      >

        {isLoading && (
          <div className="flex-1 flex items-center justify-center">
            <p className="section-label">Chargement…</p>
          </div>
        )}

        {error && (
          <div className="flex-1 flex flex-col items-center justify-center gap-2">
            <span className="material-symbols-outlined text-danger text-5xl">error_outline</span>
            <p className="text-[12.5px] text-soft">Impossible de charger ce document.</p>
          </div>
        )}

        {document && (
          <>
            {/* En-tete */}
            <div className="h-[54px] shrink-0 hair-b flex items-center gap-3 px-4">
              <span className="w-[30px] h-[30px] hair flex items-center justify-center shrink-0">
                <TypeIcon type={document.type_fichier} size={17} />
              </span>
              <div className="min-w-0 flex-1">
                {editTitre ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={titreValue}
                      autoFocus
                      onChange={(e) => setTitreValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveTitre()
                        if (e.key === 'Escape') setEditTitre(false)
                      }}
                      className="w-full bg-ink hair text-bright text-[14px] font-display font-semibold px-2 py-0.5 focus:outline-none focus:border-bright"
                    />
                    <button onClick={handleSaveTitre} className="text-success hover:text-bright transition-colors px-1" aria-label="Valider">✓</button>
                    <button onClick={() => setEditTitre(false)} className="text-danger hover:text-bright transition-colors px-1" aria-label="Annuler">✕</button>
                  </div>
                ) : (
                  <div className="font-display font-semibold text-[15px] text-bright truncate">{document.titre}</div>
                )}
                <div className="font-mono text-[10.5px] text-mute mt-px truncate">{ligneMeta}</div>
              </div>

              <button onClick={handleStartEdit} className="w-[34px] h-[34px] flex items-center justify-center text-mute hover:text-bright hover:bg-elev hair transition-colors" title="Renommer">
                <span className="material-symbols-outlined text-[16px]">edit</span>
              </button>
              <button onClick={() => versionInputRef.current?.click()} disabled={isUploading} className="w-[34px] h-[34px] flex items-center justify-center text-mute hover:text-bright hover:bg-elev hair transition-colors disabled:opacity-40" title="Mettre à jour (nouvelle version)">
                <span className="material-symbols-outlined text-[16px]">{isUploading ? 'hourglass_empty' : 'upload'}</span>
              </button>
              <button onClick={() => setConfirmDelete(true)} className="w-[34px] h-[34px] flex items-center justify-center text-mute hover:!text-danger hover:bg-elev hair transition-colors" title="Supprimer">
                <span className="material-symbols-outlined text-[16px]">delete</span>
              </button>
              <button onClick={onClose} className="w-[34px] h-[34px] flex items-center justify-center text-mute hover:text-bright hover:bg-elev hair transition-colors" title="Fermer">
                <span className="material-symbols-outlined text-[17px]">close</span>
              </button>
              <input ref={versionInputRef} type="file" accept=".pdf,.docx,.txt,.md,.jpg,.jpeg,.png" className="hidden" onChange={handleVersionChange} />
            </div>

            {/* Confirmation suppression */}
            {confirmDelete && (
              <div className="px-4 py-3 hair-b bg-elev flex items-center gap-2 shrink-0">
                <span className="text-[12px] text-soft flex-1">Supprimer ce document ?</span>
                <button onClick={() => setConfirmDelete(false)} className="font-mono text-[10px] uppercase tracking-wider text-mute hover:text-bright transition-colors">Annuler</button>
                <button onClick={handleDelete} disabled={isDeleting} className="btn-primary !bg-danger !text-bright disabled:opacity-40">{isDeleting ? '...' : 'Confirmer'}</button>
              </div>
            )}

            {/* Bannière version archivée */}
            {isViewingArchived && displayedVersion && (
              <div className="px-4 py-2.5 bg-elev hair-b flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="material-symbols-outlined text-[14px] text-type-md">history</span>
                  <span className="text-[11.5px] text-soft">
                    Vous explorez <span className="font-mono text-bright">v{displayedVersion.numero}</span> — version archivée
                  </span>
                </div>
                <button onClick={() => setSelectedVersionNumero(null)} className="font-mono text-[10px] uppercase tracking-wider text-mute hover:text-bright transition-colors shrink-0">Revenir à l'actuelle</button>
              </div>
            )}

            {/* Corps : aperçu (gauche) + rail (droite) */}
            <div className="flex-1 flex min-h-0">

              <ApercuPane document={document} />

              <aside className="w-[340px] shrink-0 hair-l flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto detail-scroll">

                  {/* Résumé */}
                  <div className="px-4 py-4 hair-b">
                    <div className="flex items-center justify-between mb-3">
                      <div className="section-label flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[12px] text-type-ai">auto_awesome</span>
                        <span>Résumé{isViewingArchived && displayedVersion ? ` · v${displayedVersion.numero}` : ''}</span>
                      </div>
                      <button
                        onClick={() => analyserDocument(isViewingArchived && displayedVersion ? displayedVersion.numero : undefined)}
                        disabled={isAnalysing}
                        className="btn-ghost flex items-center gap-1.5 disabled:opacity-40"
                      >
                        {isAnalysing ? 'Génération…' : displayedVersion?.resume_llm ? 'Régénérer' : 'Générer'}
                      </button>
                    </div>
                    {displayedVersion?.resume_llm ? (
                      (() => {
                        const resumeLong = displayedVersion.resume_llm.length > 280
                        const clamp = resumeLong && !resumeOuvert
                        return (
                          <>
                            <div className={clamp ? 'relative max-h-[192px] overflow-hidden' : ''}>
                              <ReactMarkdown components={MD_RESUME}>{displayedVersion.resume_llm}</ReactMarkdown>
                              {clamp && (
                                <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-panel to-transparent pointer-events-none" />
                              )}
                            </div>
                            {resumeLong && (
                              <button
                                onClick={() => setResumeOuvert(o => !o)}
                                className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-mute hover:text-bright transition-colors"
                              >
                                {resumeOuvert ? 'Réduire' : 'Voir tout'}
                              </button>
                            )}
                          </>
                        )
                      })()
                    ) : (
                      <p className="text-[12px] text-mute italic">Aucun résumé pour cette version.</p>
                    )}
                  </div>

                  {/* Historique des versions */}
                  <div className="px-4 py-4 hair-b">
                    <div className="flex items-center justify-between mb-4">
                      <div className="section-label">Historique</div>
                      <span className="font-mono text-[10px] text-mute">{versions.length} version{versions.length > 1 ? 's' : ''}</span>
                    </div>
                    <ol className="relative space-y-1">
                      {versions.length > 0 && (
                        <span className="absolute left-[5px] top-2 bottom-2 w-px bg-line2" aria-hidden></span>
                      )}
                      {versions.map((v) => {
                        const isLatest = latestVersion && v.numero === latestVersion.numero
                        const isSelected = displayedVersion && v.numero === displayedVersion.numero
                        return (
                          <li key={v.id} className="relative">
                            <button
                              type="button"
                              onClick={() => setSelectedVersionNumero(isLatest ? null : v.numero)}
                              className={`w-full text-left flex items-start gap-3 py-2.5 px-2 transition-all ${isSelected ? 'bg-elev hair' : 'hover:bg-elev/60 border-0.5 border-transparent'}`}
                            >
                              <div className="shrink-0 w-3 flex flex-col items-center pt-[5px] relative z-10">
                                <span className={`w-[7px] h-[7px] ${isSelected ? 'bg-bright' : isLatest ? 'bg-soft' : 'bg-mute'}`}></span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className={`font-mono text-[11.5px] ${isSelected ? 'text-bright font-semibold' : isLatest ? 'text-bright' : 'text-soft'}`}>v{v.numero}</span>
                                  {isLatest && <span className="font-mono text-[9.5px] uppercase tracking-wider text-type-txt">actuelle</span>}
                                  <span className="font-mono text-[10px] text-mute ml-auto">{formatDateTime(v.date_upload)}</span>
                                </div>
                                {v.resume_llm ? (
                                  <p className="text-[11.5px] text-soft leading-[1.5] line-clamp-2">{v.resume_llm.replace(/[#*`_>-]/g, '').trim().slice(0, 140)}</p>
                                ) : v.apercu_contenu ? (
                                  <p className="text-[11px] text-mute italic leading-[1.5] line-clamp-2">{v.apercu_contenu.slice(0, 140)}…</p>
                                ) : (
                                  <p className="text-[11px] text-mute italic">Pas encore d'aperçu</p>
                                )}
                              </div>
                            </button>
                          </li>
                        )
                      })}
                    </ol>
                  </div>

                  {/* Informations + Tags */}
                  <div className="px-4 py-4 hair-b">
                    <div className="section-label mb-3">Informations</div>
                    <dl className="space-y-2.5 text-[12px]">
                      <div className="flex items-start justify-between gap-4">
                        <dt className="text-mute">{LABELS.dossier.singulier}</dt>
                        <dd className="relative" ref={categoriePickerRef}>
                          <button
                            onClick={() => setShowCategoriePicker(v => !v)}
                            className="flex items-center gap-1.5 text-bright hover:text-bright px-1.5 py-0.5 hair border-transparent hover:border-line2 transition-colors"
                            title="Changer de dossier"
                          >
                            {categorieIdx >= 0 && <span className={`type-dot ${TYPE_DOTS[categorieIdx % TYPE_DOTS.length]}`}></span>}
                            <span>{categorieNom ?? '—'}</span>
                            <span className="material-symbols-outlined text-[12px] text-mute">unfold_more</span>
                          </button>
                          {showCategoriePicker && (
                            <div className="absolute top-full right-0 mt-1 min-w-[180px] bg-elev hair z-50 max-h-[240px] overflow-y-auto">
                              {categories.length === 0 && <div className="px-3 py-2 text-[11.5px] text-mute italic">Aucun dossier</div>}
                              {categories.map((cat, idx) => {
                                const isCurrent = cat.id === document.id_categorie
                                return (
                                  <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => handleChangeCategorie(cat.id)}
                                    className={`w-full text-left px-3 py-1.5 text-[12px] flex items-center gap-2 transition-colors hover:bg-panel ${isCurrent ? 'text-bright' : 'text-soft hover:text-bright'}`}
                                  >
                                    <span className={`type-dot ${TYPE_DOTS[idx % TYPE_DOTS.length]}`}></span>
                                    <span className="flex-1 truncate">{cat.nom}</span>
                                    {isCurrent && <span className="material-symbols-outlined text-[14px] text-bright">check</span>}
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </dd>
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <dt className="text-mute">Créé</dt>
                        <dd className="text-bright font-mono text-[11px]">{formatDateTime(document.date_creation)}</dd>
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <dt className="text-mute">Uploadé{isViewingArchived && displayedVersion ? ` · v${displayedVersion.numero}` : ''}</dt>
                        <dd className="text-bright font-mono text-[11px]">{formatDateTime(displayedVersion?.date_upload ?? document.date_upload)}</dd>
                      </div>
                      {document.auteur && (
                        <div className="flex items-start justify-between gap-4">
                          <dt className="text-mute">Auteur</dt>
                          <dd className="text-bright">{document.auteur}</dd>
                        </div>
                      )}
                      <div className="flex items-start justify-between gap-4">
                        <dt className="text-mute">Tags</dt>
                        <dd className="flex flex-wrap gap-1 justify-end max-w-[60%]">
                          {document.tags.length === 0 && <span className="text-mute italic text-[11px]">aucun</span>}
                          {document.tags.map(tag => (
                            <button
                              key={tag.id}
                              onClick={() => handleRemoveTag(tag.id)}
                              className="hair px-1.5 py-0.5 font-mono text-[10px] text-soft hover:text-bright hover:border-soft transition-colors"
                              title="Retirer ce tag"
                            >
                              {tag.name}
                            </button>
                          ))}
                        </dd>
                      </div>
                    </dl>

                    {/* Ajout de tag */}
                    <div className="mt-3 relative" ref={tagPickerRef}>
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => { setTagInput(e.target.value); setHighlightedIndex(0) }}
                        onFocus={() => setShowTagSuggestions(true)}
                        onKeyDown={handleTagInputKeyDown}
                        disabled={isCreatingTag}
                        placeholder="Ajouter un tag…"
                        className="w-full bg-ink hair text-bright px-2 py-1.5 text-[11.5px] focus:outline-none focus:border-bright disabled:opacity-60"
                      />
                      {showTagSuggestions && (filteredSuggestions.length > 0 || canCreate) && (
                        <div className="absolute bottom-full left-0 right-0 bg-elev hair mb-1 z-50">
                          {filteredSuggestions.map((tag, idx) => (
                            <button
                              key={tag.id}
                              type="button"
                              onMouseEnter={() => setHighlightedIndex(idx)}
                              onClick={() => handleAddTag(tag.id)}
                              className={`w-full text-left px-2 py-1.5 text-[11.5px] text-soft flex items-center gap-2 transition-colors ${highlightedIndex === idx ? 'bg-panel text-bright' : ''}`}
                            >
                              <span className="w-1.5 h-1.5 inline-block" style={{ backgroundColor: tag.color }} />
                              {tag.name}
                            </button>
                          ))}
                          {canCreate && (
                            <button
                              type="button"
                              onMouseEnter={() => setHighlightedIndex(filteredSuggestions.length)}
                              onClick={handleCreateAndAddTag}
                              disabled={isCreatingTag}
                              className={`w-full text-left px-2 py-1.5 font-mono text-[10px] uppercase tracking-wider text-mute hair-t transition-colors ${highlightedIndex === filteredSuggestions.length ? 'bg-panel text-bright' : ''}`}
                            >
                              {isCreatingTag ? 'Création…' : `+ Créer "${tagInput.trim()}"`}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                </div>

                {/* Action principale */}
                <div className="shrink-0 hair-t p-4">
                  <button onClick={handleDownload} className="btn-primary w-full flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[15px]" style={{ color: '#0b0b0c' }}>download</span>
                    Télécharger{isViewingArchived && displayedVersion ? ` v${displayedVersion.numero}` : ''}
                  </button>
                </div>
              </aside>

            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default DocumentViewer
