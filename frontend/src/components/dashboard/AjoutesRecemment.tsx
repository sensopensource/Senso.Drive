import { Link } from "react-router-dom"
import { useDocuments } from "../../hooks/useDocuments"
import { useCategories } from "../../hooks/useCategories"
import { formatRelatif } from "../../lib/format"
import TypeIcon from "../TypeIcon"

// Les derniers documents ajoutés (4), avec leur dossier et la date relative.
function AjoutesRecemment() {
  const { documents } = useDocuments(1, 4)
  const { categories } = useCategories()

  const nomDossier = (id: number | null) => {
    if (id == null) return 'Non classé'
    return categories.find(c => c.id === id)?.nom ?? 'Non classé'
  }

  return (
    <section className="hair bg-panel">
      <div className="flex items-end justify-between px-[22px] pt-[18px] pb-3.5">
        <div>
          <h3 className="font-display font-semibold text-[17px] tracking-tight">Ajoutés récemment</h3>
          <div className="text-[12px] text-mute mt-0.5">vos derniers documents</div>
        </div>
        <Link to="/documents" className="inline-flex items-center gap-1.5 text-[12.5px] text-type-ai hover:brightness-110">
          Tout voir <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
        </Link>
      </div>

      {documents.length === 0 ? (
        <div className="px-[22px] py-8 text-center text-[12.5px] text-mute hair-t">Aucun document pour l'instant.</div>
      ) : (
        documents.map(doc => (
          <div key={doc.id} className="grid grid-cols-[36px_1fr_auto] gap-3.5 items-center px-[22px] py-3.5 hair-t">
            <span className="w-9 h-9 hair flex items-center justify-center">
              <TypeIcon type={doc.type_fichier} />
            </span>
            <div className="min-w-0">
              <div className="text-[13.5px] text-bright truncate">{doc.titre}</div>
              <div className="text-[12px] text-mute mt-0.5">{nomDossier(doc.id_categorie)}</div>
            </div>
            <span className="text-[12px] text-soft">{formatRelatif(doc.date_creation)}</span>
          </div>
        ))
      )}
    </section>
  )
}

export default AjoutesRecemment
