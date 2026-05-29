import { useState, useEffect, useMemo } from "react"
import type { Categorie, CategorieNode } from "../../types"
import { buildTree } from "../../lib/categoriesTree"

type Props = {
  categories: Categorie[]
  movingFolderIds: Set<number>
  count: number
  onClose: () => void
  onConfirm: (targetId: number) => void
}

// Modale de choix d'un dossier destination pour la multi-sélection.
// Pas d'option "racine" : le back ne sait pas déplacer un document à la racine (cf patch_document).
function MoveToModal({ categories, movingFolderIds, count, onClose, onConfirm }: Props) {
  const [target, setTarget] = useState<number | null>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Destinations interdites : un dossier déplacé ne peut aller ni dans lui-même ni dans un de ses descendants.
  const forbidden = useMemo(() => {
    const set = new Set<number>(movingFolderIds)
    let grew = true
    while (grew) {
      grew = false
      for (const c of categories) {
        if (c.id_parent != null && set.has(c.id_parent) && !set.has(c.id)) {
          set.add(c.id)
          grew = true
        }
      }
    }
    return set
  }, [categories, movingFolderIds])

  // Arbre aplati (ordre + profondeur) pour le rendu indenté.
  const flatTree = useMemo(() => {
    const out: CategorieNode[] = []
    const walk = (nodes: CategorieNode[]) => {
      for (const n of nodes) {
        out.push(n)
        walk(n.children)
      }
    }
    walk(buildTree(categories))
    return out
  }, [categories])

  const aucuneDestination = flatTree.every(n => forbidden.has(n.id))

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[460px] max-h-[70vh] bg-panel hair flex flex-col"
      >
        <div className="px-5 py-3 hair-b flex items-center justify-between shrink-0">
          <div className="section-label">
            Déplacer {count} élément{count > 1 ? 's' : ''} vers…
          </div>
          <button onClick={onClose} className="text-mute hover:text-bright transition-colors" aria-label="Fermer">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {aucuneDestination ? (
            <p className="px-5 py-6 text-center text-[12.5px] text-soft">Aucun dossier de destination disponible.</p>
          ) : (
            flatTree.map(node => {
              const interdit = forbidden.has(node.id)
              const choisi = target === node.id
              return (
                <button
                  key={node.id}
                  type="button"
                  disabled={interdit}
                  onClick={() => setTarget(node.id)}
                  style={{ paddingLeft: 20 + node.depth * 18 }}
                  className={`flex items-center gap-2 w-full pr-5 py-2 text-left text-[13px] transition-colors ${
                    interdit
                      ? 'text-mute opacity-40 cursor-not-allowed'
                      : choisi
                        ? 'bg-type-ai/[0.1] text-bright'
                        : 'text-soft hover:bg-elev hover:text-bright'
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[16px] shrink-0"
                    style={{ color: node.privee ? 'var(--mute)' : 'var(--type-md)' }}
                  >
                    {node.privee ? 'folder_special' : 'folder'}
                  </span>
                  <span className="truncate">{node.nom}</span>
                  {choisi && <span className="material-symbols-outlined text-[16px] text-type-ai ml-auto shrink-0">check</span>}
                </button>
              )
            })
          )}
        </div>

        <div className="px-5 py-3 hair-t flex items-center justify-end gap-2 shrink-0">
          <button type="button" onClick={onClose} className="btn-ghost">Annuler</button>
          <button
            type="button"
            disabled={target === null}
            onClick={() => { if (target !== null) onConfirm(target) }}
            className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Déplacer ici
          </button>
        </div>
      </div>
    </div>
  )
}

export default MoveToModal
