import { Link } from "react-router-dom"
import { useDashboard } from "../../hooks/useDashboard"
import { fileTypeMeta } from "../../lib/fileTypes"

// Répartition des documents par type de fichier (barres), depuis GET /dashboard.
function MesDocumentsTypes() {
  const { documentsTotal, docsParType } = useDashboard()
  const lignes = Object.entries(docsParType)
    .filter(([, nb]) => nb > 0)
    .sort((a, b) => b[1] - a[1])
  const max = lignes.length > 0 ? lignes[0][1] : 1

  return (
    <section className="hair bg-panel">
      <div className="flex items-end justify-between px-[22px] pt-[18px] pb-3.5">
        <div>
          <h3 className="font-display font-semibold text-[17px] tracking-tight">Mes documents</h3>
          <div className="text-[12px] text-mute mt-0.5">{documentsTotal} fichier{documentsTotal > 1 ? 's' : ''}</div>
        </div>
        <Link to="/documents" className="inline-flex items-center gap-1.5 text-[12.5px] text-type-ai hover:brightness-110">
          Parcourir <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
        </Link>
      </div>

      <div className="px-[22px] pb-5">
        {lignes.length === 0 ? (
          <div className="py-6 text-center text-[12.5px] text-mute">Aucun document pour l'instant.</div>
        ) : (
          lignes.map(([type, nb]) => {
            const meta = fileTypeMeta(type)
            return (
              <div key={type} className="flex items-center gap-3.5 py-2.5 hair-b last:border-b-0">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: meta.couleur }} />
                <span className="text-[13.5px] text-bright w-[90px]">{meta.label}</span>
                <span className="flex-1 h-1.5 bg-line rounded overflow-hidden">
                  <span className="block h-full rounded" style={{ width: `${Math.round((nb / max) * 100)}%`, background: meta.couleur }} />
                </span>
                <span className="text-[12.5px] text-soft w-[80px] text-right">{nb} fichier{nb > 1 ? 's' : ''}</span>
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}

export default MesDocumentsTypes
