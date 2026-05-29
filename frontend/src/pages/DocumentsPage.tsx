import { useState, useEffect } from "react"
import { useSearchParams, Link } from "react-router-dom"
import { useDocuments } from "../hooks/useDocuments"
import { useSearchDocuments, type SearchFilters } from "../hooks/useSearchDocuments"
import { useCategories } from "../hooks/useCategories"
import { useUpdateDocument } from "../hooks/useUpdateDocument"
import { getAncestors, getDirectChildren } from "../lib/categoriesTree"
import type { DndPayload } from "../lib/dnd"
import DocumentsTable from "../components/DocumentsTable"
import ExplorerGrid from "../components/explorer/ExplorerGrid"
import AppShell from "../components/AppShell"
import SubBar from "../components/SubBar"
import UploadModal from "../components/UploadModal"
import NewCategorieModal from "../components/NewCategorieModal"
import DocumentInlinePanel from "../components/DocumentInlinePanel"
import SearchFiltersPanel from "../components/SearchFilters"
import { useDeleteDocument } from "../hooks/useDeleteDocument"
import { useDeleteCategorie } from "../hooks/useDeleteCategorie"
import { telechargerDocument } from "../lib/download"
import type { DocActions, FolderActions } from "../components/explorer/actions"

const SIZE = 20
type Vue = 'liste' | 'grille'

function DocumentsPage() {
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [newFolderOpen, setNewFolderOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [vue, setVue] = useState<Vue>('liste')
  const [searchParams, setSearchParams] = useSearchParams()

  // Filtre cat (navigation par dossier) = lecture URL ?cat=<id>
  const filterCategorie = (() => {
    const v = searchParams.get('cat')
    return v ? Number(v) : null
  })()

  const searchQuery = searchParams.get('query') ?? ''
  const searchFilters: SearchFilters = {
    type_fichier: searchParams.get('type_fichier'),
    auteur: searchParams.get('auteur'),
    id_categorie: filterCategorie,
    id_tags: searchParams.getAll('id_tags').map(Number),
    date_debut: searchParams.get('date_debut'),
    date_fin: searchParams.get('date_fin'),
  }
  const isSearchMode = (
    searchQuery.length > 0
    || !!searchFilters.type_fichier
    || !!searchFilters.auteur
    || (searchFilters.id_tags?.length ?? 0) > 0
    || !!searchFilters.date_debut
    || !!searchFilters.date_fin
  )

  const { categories, updateCategorie } = useCategories()
  const { updateDocument } = useUpdateDocument()
  const { deleteDocument } = useDeleteDocument()
  const { deleteCategorie } = useDeleteCategorie()
  const { documents, total, isLoading: isLoadingAll, error: errorAll } = useDocuments(page, SIZE, filterCategorie)
  const { results, isLoading: isLoadingSearch, error: errorSearch } = useSearchDocuments(searchQuery, searchFilters)
  const items = isSearchMode ? results : documents
  const isLoading = isSearchMode ? isLoadingSearch : isLoadingAll
  const error = isSearchMode ? errorSearch : errorAll
  const totalPages = Math.max(1, Math.ceil(total / SIZE))

  const subFolders = !isSearchMode ? getDirectChildren(categories, filterCategorie) : []
  const ancestors = filterCategorie != null ? getAncestors(categories, filterCategorie) : []

  // Ouverture/selection pilotees par l'URL (lien sidebar ?upload=1, resultat de recherche ?focus=id).
  // Sync depuis un systeme externe (l'URL) -> usage legitime d'un effet.
  useEffect(() => {
    if (searchParams.get('upload') === '1') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsUploadOpen(true)
      const next = new URLSearchParams(searchParams)
      next.delete('upload')
      setSearchParams(next, { replace: true })
    }
    const focusId = searchParams.get('focus')
    if (focusId) {
      setSelectedId(Number(focusId))
      const next = new URLSearchParams(searchParams)
      next.delete('focus')
      setSearchParams(next, { replace: true })
    }
  }, [searchParams, setSearchParams])

  // Reset de la pagination quand on change de dossier (ajustement d'etat pendant le rendu)
  const [catPrec, setCatPrec] = useState(filterCategorie)
  if (filterCategorie !== catPrec) {
    setCatPrec(filterCategorie)
    setPage(1)
  }

  const handleOpenFolder = (id: number) => {
    const next = new URLSearchParams(searchParams)
    next.set('cat', String(id))
    setSearchParams(next)
  }

  const handleDropOnFolder = (payload: DndPayload, targetCategorieId: number) => {
    if (payload.kind === 'doc') {
      const targetNom = categories.find(c => c.id === targetCategorieId)?.nom ?? '?'
      updateDocument({
        id: payload.id,
        id_categorie: targetCategorieId,
        successMessage: `Document déplacé dans "${targetNom}"`,
      })
    } else if (payload.kind === 'folder') {
      if (payload.id === targetCategorieId) return
      updateCategorie({ id: payload.id, id_parent: targetCategorieId, updateParent: true })
    }
  }

  const goToRoot = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('cat')
    setSearchParams(next)
  }

  const docActions: DocActions = {
    rename: (id, titre) => updateDocument({ id, titre, successMessage: `Renommé en « ${titre} »` }),
    remove: (id) => deleteDocument(id),
    download: (doc) => telechargerDocument(doc.id, doc.type_fichier ? `${doc.titre}.${doc.type_fichier}` : doc.titre),
  }
  const folderActions: FolderActions = {
    rename: (id, nom) => updateCategorie({ id, nom }),
    togglePrivee: (cat) => updateCategorie({ id: cat.id, privee: !cat.privee }),
    remove: (id) => deleteCategorie(id),
  }

  const dossierCourant = ancestors.length > 0 ? ancestors[ancestors.length - 1] : null
  const peuplé = items.length > 0 || subFolders.length > 0

  return (
    <AppShell>
      <div className="flex-1 flex flex-col min-h-0">

        {/* Sous-barre : fil d'Ariane + outils */}
        <SubBar>
          <div className="flex items-center gap-1.5 min-w-0">
            <button onClick={goToRoot} className="flex items-center gap-1.5 text-[14px] text-soft hover:text-bright transition-colors shrink-0">
              <span className="material-symbols-outlined text-[17px] text-mute">folder_open</span> Mes documents
            </button>
            {isSearchMode ? (
              <>
                <span className="material-symbols-outlined text-[16px] text-mute">chevron_right</span>
                <span className="text-[14px] text-soft truncate">Recherche : {searchQuery}</span>
              </>
            ) : (
              ancestors.map((a, idx) => {
                const isLast = idx === ancestors.length - 1
                return (
                  <span key={a.id} className="flex items-center gap-1.5 min-w-0">
                    <span className="material-symbols-outlined text-[16px] text-mute">chevron_right</span>
                    {isLast ? (
                      <span className="font-display font-semibold text-[15px] text-bright truncate">{a.nom}</span>
                    ) : (
                      <Link to={`/documents?cat=${a.id}`} className="text-[14px] text-soft hover:text-bright transition-colors truncate">{a.nom}</Link>
                    )}
                  </span>
                )
              })
            )}
          </div>

          <div className="ml-auto flex items-center gap-2 shrink-0">
            <SearchFiltersPanel searchParams={searchParams} setSearchParams={setSearchParams} />
            <div className="flex hair">
              <button
                onClick={() => setVue('liste')}
                className={`flex items-center gap-1.5 h-[30px] px-3 text-[12px] hair-r transition-colors ${vue === 'liste' ? 'bg-bright text-ink font-semibold' : 'text-soft hover:bg-elev'}`}
              >
                <span className="material-symbols-outlined text-[16px]">view_list</span> Liste
              </button>
              <button
                onClick={() => setVue('grille')}
                className={`flex items-center gap-1.5 h-[30px] px-3 text-[12px] transition-colors ${vue === 'grille' ? 'bg-bright text-ink font-semibold' : 'text-soft hover:bg-elev'}`}
              >
                <span className="material-symbols-outlined text-[16px]">grid_view</span> Grille
              </button>
            </div>
            <button onClick={() => setNewFolderOpen(true)} className="btn-ghost inline-flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px]">create_new_folder</span> Nouveau dossier
            </button>
            <button onClick={() => setIsUploadOpen(true)} className="btn-primary flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px]" style={{ color: '#0b0b0c' }}>upload</span> Importer
            </button>
          </div>
        </SubBar>

        {/* Contenu : vue + panneau détail */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-hidden flex flex-col min-w-0">

            {isLoading && (
              <div className="flex-1 flex items-center justify-center"><p className="section-label">Chargement...</p></div>
            )}

            {error && (
              <div className="flex-1 flex flex-col items-center justify-center gap-2">
                <span className="material-symbols-outlined text-danger text-5xl">error_outline</span>
                <p className="text-[12.5px] text-soft">{isSearchMode ? "Erreur lors de la recherche." : "Impossible de charger vos documents."}</p>
              </div>
            )}

            {!isLoading && !error && !peuplé && (
              <div className="flex-1 flex flex-col items-center justify-center gap-2">
                <span className="material-symbols-outlined text-mute text-5xl">{isSearchMode ? 'manage_search' : 'inventory_2'}</span>
                <p className="text-[12.5px] text-soft">
                  {isSearchMode
                    ? `Aucun résultat pour « ${searchQuery} ».`
                    : filterCategorie != null ? 'Aucun document dans ce dossier.' : 'Votre drive est vide.'}
                </p>
                {!isSearchMode && filterCategorie == null && <p className="section-label">Cliquez sur "Importer" pour commencer.</p>}
              </div>
            )}

            {!isLoading && !error && peuplé && (
              vue === 'grille' ? (
                <ExplorerGrid
                  subFolders={subFolders}
                  items={items}
                  categories={categories}
                  selectedId={selectedId}
                  isSearchMode={isSearchMode}
                  onOpenFolder={handleOpenFolder}
                  onSelectDoc={setSelectedId}
                  onDropOnFolder={handleDropOnFolder}
                />
              ) : (
                <DocumentsTable
                  items={items}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  isSearchMode={isSearchMode}
                  subFolders={subFolders}
                  onOpenFolder={handleOpenFolder}
                  onDropOnFolder={handleDropOnFolder}
                  docActions={docActions}
                  folderActions={folderActions}
                />
              )
            )}

            {!isSearchMode && items.length > 0 && (
              <div className="h-10 shrink-0 hair-t px-6 flex items-center justify-between bg-ink/60">
                <span className="font-mono text-[10.5px] text-mute">{items.length} sur {total}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(p => p - 1)} disabled={page <= 1} className="w-7 h-7 flex items-center justify-center text-mute hover:text-bright hair disabled:opacity-40 disabled:cursor-not-allowed" aria-label="Page précédente">
                    <span className="material-symbols-outlined text-[14px]">chevron_left</span>
                  </button>
                  <span className="font-mono text-[11px] text-soft px-2">{page} / {totalPages}</span>
                  <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages} className="w-7 h-7 flex items-center justify-center text-bright hair disabled:opacity-40 disabled:cursor-not-allowed" aria-label="Page suivante">
                    <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {selectedId !== null && (
            <DocumentInlinePanel documentId={selectedId} onClose={() => setSelectedId(null)} />
          )}
        </div>
      </div>

      {isUploadOpen && <UploadModal onClose={() => setIsUploadOpen(false)} />}
      {newFolderOpen && (
        <NewCategorieModal
          parentId={filterCategorie}
          parentNom={dossierCourant?.nom ?? null}
          onClose={() => setNewFolderOpen(false)}
        />
      )}
    </AppShell>
  )
}

export default DocumentsPage
