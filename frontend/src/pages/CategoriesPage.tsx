import { useState, type ChangeEvent, type FormEvent } from "react"
import CategorieCard from "../components/CategorieCard"
import { useCategories } from "../hooks/useCategories"
import AppShell from "../components/AppShell"

function CategoriesPage() {
  const { categories, addCategorie, updateCategorie } = useCategories()
  const [nouveauNom, setNouveauNom] = useState('')

  const handleAddCategorie = async (e: FormEvent) => {
    e.preventDefault()
    if (!nouveauNom.trim()) return
    await addCategorie(nouveauNom.trim())
    setNouveauNom('')
  }

  return (
    <AppShell>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[960px] mx-auto px-6 py-12">

          <div className="mb-10">
            <div className="text-[10.5px] font-mono text-mute uppercase tracking-wider mb-2">Organisation</div>
            <h1 className="text-[28px] font-semibold tracking-tight text-bright">Mes catégories</h1>
            <p className="text-[12.5px] text-soft mt-1.5">
              {categories.length} {categories.length > 1 ? 'catégories' : 'catégorie'} dans votre drive.
            </p>
          </div>

          <form onSubmit={handleAddCategorie} className="flex gap-2 mb-6">
            <input
              type="text"
              placeholder="Nouvelle catégorie..."
              value={nouveauNom}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setNouveauNom(e.target.value)}
              autoComplete="off"
              className="flex-1 hair bg-transparent text-[12.5px] text-bright px-2.5 py-2 outline-none focus:border-soft transition-colors placeholder:text-mute"
            />
            <button
              type="submit"
              disabled={!nouveauNom.trim()}
              className="btn-primary flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[15px]" style={{ color: '#0b0b0c' }}>add</span>
              Ajouter
            </button>
          </form>

          {categories.length === 0 ? (
            <div className="hair bg-panel p-12 text-center">
              <span className="material-symbols-outlined text-mute text-5xl mb-3 block">label_off</span>
              <p className="text-[12.5px] text-soft">Aucune catégorie pour l'instant.</p>
              <p className="text-[10.5px] font-mono text-mute uppercase tracking-wider mt-1">Créez-en une via le champ ci-dessus.</p>
            </div>
          ) : (
            <ul className="bg-panel hair divide-y divide-[var(--line)]">
              {categories.map(cat => (
                <CategorieCard
                  key={cat.id}
                  categorie={cat}
                  onUpdate={updateCategorie}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </AppShell>
  )
}

export default CategoriesPage
