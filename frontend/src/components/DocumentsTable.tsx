import type { Document, Categorie } from "../types"
import DocumentRow from "./DocumentRow"

type Props = {
  items: Document[]
  selectedId: number | null
  onSelect: (id: number) => void
  categories: Categorie[]
  isSearchMode: boolean
}

function DocumentsTable({ items, selectedId, onSelect, categories, isSearchMode }: Props) {
  const categorieNomById = new Map(categories.map(c => [c.id, c.nom]))

  return (
    <section className="flex-1 overflow-hidden flex flex-col min-w-0">

      {/* Column headers */}
      <div className="flex items-center px-6 h-9 hair-b bg-ink/60 shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-mute">
        <div className="w-6"></div>
        <div className="flex-1 min-w-0">Nom</div>
        <div className="w-[140px] hidden lg:block">Catégorie</div>
        <div className="w-[130px] hidden md:block">Modifié</div>
        <div className="w-[60px] text-right">Type</div>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto">
        {items.map((doc, idx) => (
          <DocumentRow
            key={doc.id}
            document={doc}
            index={idx}
            isSelected={selectedId === doc.id}
            onClick={() => onSelect(doc.id)}
            categorieNom={doc.id_categorie ? categorieNomById.get(doc.id_categorie) : null}
            extrait={isSearchMode ? (doc as Document & { extrait?: string | null }).extrait : null}
          />
        ))}
      </div>
    </section>
  )
}

export default DocumentsTable
