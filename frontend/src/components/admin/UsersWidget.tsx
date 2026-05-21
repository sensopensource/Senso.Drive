import { useState } from "react"
import Widget from "./Widget"
import { useAdminUsers, useDeleteUser } from "../../hooks/useAdminUsers"
import { useAuth } from "../../contexts/AuthContext"
import { useToast } from "../../contexts/ToastContext"
import { formatNombre, formatDateCourte, formatRelatif } from "../../lib/format"
import type { UtilisateurAdminRow } from "../../types"

type Props = {
  className?: string
}

function initiales(nom: string): string {
  return nom.slice(0, 2).toUpperCase()
}

function UsersWidget({ className }: Props) {
  const { users, isLoading } = useAdminUsers()
  const { user: courant } = useAuth()
  const [recherche, setRecherche] = useState('')
  const [aSupprimer, setASupprimer] = useState<UtilisateurAdminRow | null>(null)

  const rechercheLower = recherche.trim().toLowerCase()
  const visibles = users.filter(u =>
    !rechercheLower || `${u.nom} ${u.email}`.toLowerCase().includes(rechercheLower)
  )

  return (
    <Widget
      title="Utilisateurs enregistrés"
      icon="group"
      counter={`${users.length} compte${users.length > 1 ? 's' : ''}`}
      bodyFlush
      className={className}
      footer={<span>{visibles.length} / {users.length} affichés</span>}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-2.5 px-3.5 py-2 hair-b">
        <span className="material-symbols-outlined text-mute text-[16px]">search</span>
        <input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="filtrer par nom ou email…"
          className="flex-1 bg-transparent border-0 text-bright text-[12.5px] outline-none placeholder:text-mute"
        />
      </div>

      {isLoading ? (
        <div className="p-3.5 font-mono text-[10.5px] text-mute">Chargement…</div>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {['Utilisateur', 'Rôle', 'Inscrit le'].map(h => (
                <th key={h} className="text-left px-3.5 py-2 hair-b font-mono text-[9.5px] uppercase tracking-wider text-mute font-medium">{h}</th>
              ))}
              {['Docs', 'Tokens 30j', 'Suggestions'].map(h => (
                <th key={h} className="text-right px-3.5 py-2 hair-b font-mono text-[9.5px] uppercase tracking-wider text-mute font-medium tabular-nums">{h}</th>
              ))}
              <th className="text-left px-3.5 py-2 hair-b font-mono text-[9.5px] uppercase tracking-wider text-mute font-medium">Dernière activité</th>
              <th className="hair-b w-[60px]" />
            </tr>
          </thead>
          <tbody>
            {visibles.map(u => (
              <tr key={u.id} className="group hover:bg-elev">
                <td className="px-3.5 py-2.5 hair-b text-[12.5px] align-middle">
                  <div className="flex items-center gap-2.5">
                    <div className="w-[22px] h-[22px] bg-elev hair flex items-center justify-center font-mono text-[10px] text-soft shrink-0">
                      {initiales(u.nom)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-bright truncate">{u.nom}</div>
                      <div className="font-mono text-[10.5px] text-mute truncate">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3.5 py-2.5 hair-b align-middle">
                  <span className={`font-mono text-[9.5px] uppercase tracking-wider px-1.5 py-0.5 hair ${u.role === 'admin' ? 'text-type-md' : 'text-soft'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-3.5 py-2.5 hair-b text-[12.5px] text-soft align-middle">{formatDateCourte(u.date_inscription)}</td>
                <td className="px-3.5 py-2.5 hair-b text-right font-mono text-[11.5px] text-soft tabular-nums align-middle">{formatNombre(u.nb_documents)}</td>
                <td className="px-3.5 py-2.5 hair-b text-right font-mono text-[11.5px] text-soft tabular-nums align-middle">{formatNombre(u.tokens_30j)}</td>
                <td className="px-3.5 py-2.5 hair-b text-right font-mono text-[11.5px] text-soft tabular-nums align-middle">{u.nb_suggestions}</td>
                <td className="px-3.5 py-2.5 hair-b font-mono text-[11px] text-soft align-middle">{formatRelatif(u.dernier_login)}</td>
                <td className="px-3.5 py-2.5 hair-b align-middle">
                  {u.id !== courant?.id && (
                    <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => setASupprimer(u)}
                        className="w-6 h-6 flex items-center justify-center text-mute hover:text-danger hover:bg-elev transition-colors"
                        title="Supprimer l'utilisateur"
                      >
                        <span className="material-symbols-outlined text-[14px]">delete</span>
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {aSupprimer && (
        <ConfirmSuppression
          utilisateur={aSupprimer}
          onClose={() => setASupprimer(null)}
        />
      )}
    </Widget>
  )
}

function ConfirmSuppression({ utilisateur, onClose }: { utilisateur: UtilisateurAdminRow; onClose: () => void }) {
  const { deleteUser, isPending } = useDeleteUser()
  const { showToast } = useToast()

  const confirmer = async () => {
    try {
      await deleteUser(utilisateur.id)
      showToast(`Utilisateur "${utilisateur.nom}" supprimé`, 'success')
      onClose()
    } catch {
      showToast("Échec de la suppression", 'error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-[420px] bg-panel hair flex flex-col">
        <div className="px-5 py-3 hair-b">
          <div className="section-label">Supprimer l'utilisateur</div>
        </div>
        <div className="p-5">
          <p className="text-[13px] text-bright mb-2">
            Supprimer "<span className="font-semibold">{utilisateur.nom}</span>" ?
          </p>
          <p className="text-[12px] text-soft">
            Ses {utilisateur.nb_documents} document{utilisateur.nb_documents > 1 ? 's' : ''}, catégories et tags seront supprimés. Cette action est irréversible.
          </p>
          <div className="flex items-center justify-end gap-2 mt-5">
            <button onClick={onClose} className="btn-ghost">Annuler</button>
            <button onClick={confirmer} disabled={isPending} className="btn-primary !bg-danger !text-bright disabled:opacity-40">
              {isPending ? '...' : 'Supprimer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UsersWidget
