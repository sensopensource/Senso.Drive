import { useState, useEffect } from "react"
import { useSearchParams, Link } from "react-router-dom"
import { useDocuments } from "../hooks/useDocuments"
import { useSearchDocuments, type SearchFilters } from "../hooks/useSearchDocuments"
import { useCategories } from "../hooks/useCategories"
import { useUpdateDocument } from "../hooks/useUpdateDocument"
import { getAncestors, getDirectChildren } from "../lib/categoriesTree"
import DocumentsTable from "../components/DocumentsTable"
import AppShell from "../components/AppShell"
import UploadModal from "../components/UploadModal"
import DocumentInlinePanel from "../components/DocumentInlinePanel"
import SearchFiltersPanel from "../components/SearchFilters"

const SIZE = 20

function DocumentsPage() {
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [searchParams, setSearchParams] = useSearchParams()

  // Filtre cat (navigation par dossier) = lecture URL ?cat=<id>
  const filterCategorie = (() => {
    const v = searchParams.get('cat')
    return v ? Number(v) : null
  })()

  // Recherche : query + filtres lus depuis l'URL (pousses par la TopBar avec navigate)
  // Le filtre categorie reutilise le param `cat` (commun avec la navigation par dossier)
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
  const { documents, total, isLoading: isLoadingAll, error: errorAll } = useDocuments(page, SIZE, filterCategorie)
  const { results, isLoading: isLoadingSearch, error: errorSearch } = useSearchDocuments(searchQuery, searchFilters)
  const items = isSearchMode ? results : documents
  const isLoading = isSearchMode ? isLoadingSearch : isLoadingAll
  const error = isSearchMode ? errorSearch : errorAll
  const totalPages = Math.max(1, Math.ceil(total / SIZE))

  // Sous-dossiers du dossier courant (vide en mode recherche ou racine si filterCategorie=null)
  const subFolders = !isSearchMode ? getDirectChildren(categories, filterCategorie) : []

  // Breadcrumb : chaine d'ancetres du dossier courant
  const ancestors = filterCategorie != null ? getAncestors(categories, filterCategorie) : []

  useEffect(() => {
    if (searchParams.get('upload') === '1') {
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

  // Reset la pagination quand le filtre change
  useEffect(() => {
    setPage(1)
  }, [filterCategorie])

  const handleOpenFolder = (id: number) => {
    const next = new URLSearchParams(searchParams)
    next.set('cat', String(id))
    setSearchParams(next)
  }

  const handleDropOnFolder = (
    payload: { kind: 'doc' | 'folder'; id: number },
    targetCategorieId: number,
  ) => {
    if (payload.kind === 'doc') {
      const targetNom = categories.find(c => c.id === targetCategorieId)?.nom ?? '?'
      updateDocument({
        id: payload.id,
        id_categorie: targetCategorieId,
        successMessage: `Document déplacé dans "${targetNom}"`,
      })
    } else if (payload.kind === 'folder') {
      if (payload.id === targetCategorieId) return
      updateCategorie({
        id: payload.id,
        id_parent: targetCategorieId,
        updateParent: true,
      })
    }
  }

  const goToRoot = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('cat')
    setSearchParams(next)
  }

  const currentFolderNom = ancestors.length > 0 ? ancestors[ancestors.length - 1].nom : null

  return (
    <AppShell>

      {/* Header / breadcrumb + tools */}
      <div className="px-6 pt-5 pb-4 hair-b flex items-end justify-between shrink-0 bg-ink/40">
        <div className="min-w-0 flex-1">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[11px] font-mono text-mute mb-1.5 flex-wrap">
            <button onClick={goToRoot} className="hover:text-bright transition-colors">Senso</button>
            <span className="text-line2">/</span>
            {isSearchMode ? (
              <span className="text-soft truncate">Recherche : {searchQuery}</span>
            ) : ancestors.length === 0 ? (
              <span className="text-soft">Tous mes documents</span>
            ) : (
              ancestors.map((a, idx) => {
                const isLast = idx === ancestors.length - 1
                return (
                  <span key={a.id} className="flex items-center gap-2">
                    {isLast ? (
                      <span className="text-soft truncate">{a.nom}</span>
                    ) : (
                      <>
                        <Link to={`/documents?cat=${a.id}`} className="hover:text-bright transition-colors truncate">
                          {a.nom}
                        </Link>
                        <span className="text-line2">/</span>
                      </>
                    )}
                  </span>
                )
              })
            )}
          </div>
          <h1 className="text-[22px] font-semibold tracking-tight text-bright truncate">
            {isSearchMode ? 'Résultats de recherche' : (currentFolderNom ?? 'Mes documents')}
          </h1>
          <p className="text-[12px] text-soft mt-1">
            {isSearchMode
              ? `${results.length} ${results.length > 1 ? 'résultats' : 'résultat'} pour « ${searchQuery} »`
              : (
                <>
                  {total} {total > 1 ? 'fichiers' : 'fichier'}
                  {subFolders.length > 0 && (
                    <>{' · '}{subFolders.length} {subFolders.length > 1 ? 'sous-dossiers' : 'sous-dossier'}</>
                  )}
                </>
              )}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <SearchFiltersPanel searchParams={searchParams} setSearchParams={setSearchParams} />
          <div className="w-[0.5px] h-5 bg-line mx-1"></div>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="btn-primary flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[15px]" style={{ color: '#0b0b0c' }}>upload</span>
            <span>Importer</span>
          </button>
        </div>
      </div>

      {/* Content area : list + inline detail panel */}
      <div className="flex-1 flex overflow-hidden">

        <div className="flex-1 overflow-hidden flex flex-col min-w-0">

          {isLoading && (
            <div className="flex-1 flex items-center justify-center">
              <p className="section-label">Chargement...</p>
            </div>
          )}

          {error && (
            <div className="flex-1 flex flex-col items-center justify-center gap-2">
              <span className="material-symbols-outlined text-danger text-5xl">error_outline</span>
              <p className="font-body text-sm text-soft">
                {isSearchMode ? "Erreur lors de la recherche." : "Impossible de charger vos documents."}
              </p>
            </div>
          )}

          {!isLoading && !error && items.length === 0 && subFolders.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center gap-2">
              <span className="material-symbols-outlined text-mute text-5xl">
                {isSearchMode ? 'manage_search' : 'inventory_2'}
              </span>
              <p className="font-body text-sm text-soft">
                {isSearchMode
                  ? `Aucun résultat pour « ${searchQuery} ».`
                  : filterCategorie != null
                    ? 'Aucun document dans ce dossier.'
                    : 'Votre drive est vide.'}
              </p>
              {!isSearchMode && filterCategorie == null && (
                <p className="section-label">Cliquez sur "Importer" pour commencer.</p>
              )}
            </div>
          )}

          {!isLoading && !error && (items.length > 0 || subFolders.length > 0) && (
            <DocumentsTable
              items={items}
              selectedId={selectedId}
              onSelect={setSelectedId}
              categories={categories}
              isSearchMode={isSearchMode}
              subFolders={subFolders}
              onOpenFolder={handleOpenFolder}
              onDropOnFolder={handleDropOnFolder}
            />
          )}

          {!isSearchMode && items.length > 0 && (
            <div className="h-10 shrink-0 hair-t px-6 flex items-center justify-between bg-ink/60">
              <span className="font-mono text-[10.5px] text-mute">
                {items.length} sur {total}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => p - 1)}
                  disabled={page <= 1}
                  className="w-7 h-7 flex items-center justify-center text-mute hover:text-bright hair disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Page précédente"
                >
                  <span className="material-symbols-outlined text-[14px]">chevron_left</span>
                </button>
                <span className="font-mono text-[11px] text-soft px-2">{page} / {totalPages}</span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= totalPages}
                  className="w-7 h-7 flex items-center justify-center text-bright hair disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Page suivante"
                >
                  <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {selectedId !== null && (
          <DocumentInlinePanel
            documentId={selectedId}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>

      {isUploadOpen && <UploadModal onClose={() => setIsUploadOpen(false)} />}
    </AppShell>
  )
}

export default DocumentsPage
