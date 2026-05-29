import type { Document, Categorie } from "../../types"
import type { DndPayload } from "../../lib/dnd"
import { getDirectChildren } from "../../lib/categoriesTree"
import FolderCard from "./FolderCard"
import DocCard from "./DocCard"
import type { DocActions, FolderActions } from "./actions"

type Props = {
  subFolders: Categorie[]
  items: Document[]
  categories: Categorie[]
  selectedId: number | null
  isSearchMode: boolean
  onOpenFolder: (id: number) => void
  onSelectDoc: (id: number) => void
  onDropOnFolder: (payload: DndPayload, targetId: number) => void
  docActions: DocActions
  folderActions: FolderActions
}

const GRID = "grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3.5"
const GRP = "font-mono text-[10px] uppercase tracking-[0.12em] text-mute mb-3.5"

// Vue grille de l'explorateur : dossiers en cartes puis documents en cartes.
function ExplorerGrid({ subFolders, items, categories, selectedId, isSearchMode, onOpenFolder, onSelectDoc, onDropOnFolder, docActions, folderActions }: Props) {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-5">
      {!isSearchMode && subFolders.length > 0 && (
        <>
          <div className={GRP}>Dossiers · {subFolders.length}</div>
          <div className={`${GRID} mb-7`}>
            {subFolders.map(f => (
              <FolderCard
                key={f.id}
                categorie={f}
                nbSousDossiers={getDirectChildren(categories, f.id).length}
                onOpen={() => onOpenFolder(f.id)}
                onDrop={onDropOnFolder}
                actions={folderActions}
              />
            ))}
          </div>
        </>
      )}

      {items.length > 0 && (
        <>
          <div className={GRP}>Documents · {items.length}</div>
          <div className={GRID}>
            {items.map(d => (
              <DocCard key={d.id} document={d} selected={selectedId === d.id} onOpen={() => onSelectDoc(d.id)} actions={docActions} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default ExplorerGrid
