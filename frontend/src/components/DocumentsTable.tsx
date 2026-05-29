import type { Document, Categorie } from "../types"
import DocumentRow from "./DocumentRow"
import CategorieRow from "./CategorieRow"
import type { DocActions, FolderActions } from "./explorer/actions"

type Props = {
  items: Document[]
  selectedId: number | null
  onSelect: (id: number) => void
  isSearchMode: boolean
  subFolders?: Categorie[]
  onOpenFolder?: (id: number) => void
  onDropOnFolder?: (payload: { kind: 'doc' | 'folder'; id: number }, targetCategorieId: number) => void
  docActions: DocActions
  folderActions: FolderActions
}

const GRP = "px-6 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-mute bg-ink/40 hair-b"

function DocumentsTable({
  items,
  selectedId,
  onSelect,
  isSearchMode,
  subFolders = [],
  onOpenFolder,
  onDropOnFolder,
  docActions,
  folderActions,
}: Props) {
  return (
    <section className="flex-1 overflow-hidden flex flex-col min-w-0">

      {/* En-tete colonnes */}
      <div className="flex items-center px-6 h-9 hair-b bg-ink/60 shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-mute">
        <div className="flex-1 min-w-0 pl-[28px]">Nom</div>
        <div className="w-[130px] hidden md:block">Modifié</div>
        <div className="w-[90px] text-right">Taille</div>
        <div className="w-7"></div>
      </div>

      {/* Lignes */}
      <div className="flex-1 overflow-y-auto">

        {/* Groupe Dossiers */}
        {!isSearchMode && subFolders.length > 0 && (
          <div className={GRP}>Dossiers · {subFolders.length}</div>
        )}
        {subFolders.map((folder, idx) => (
          <CategorieRow
            key={`folder-${folder.id}`}
            categorie={folder}
            index={idx}
            onClick={() => onOpenFolder?.(folder.id)}
            onDrop={onDropOnFolder}
            actions={folderActions}
          />
        ))}

        {/* Groupe Documents */}
        {items.length > 0 && (
          <div className={GRP}>Documents · {items.length}</div>
        )}
        {items.map((doc, idx) => (
          <DocumentRow
            key={doc.id}
            document={doc}
            index={subFolders.length + idx}
            isSelected={selectedId === doc.id}
            onClick={() => onSelect(doc.id)}
            actions={docActions}
            extrait={isSearchMode ? (doc as Document & { extrait?: string | null }).extrait : null}
          />
        ))}
      </div>
    </section>
  )
}

export default DocumentsTable
