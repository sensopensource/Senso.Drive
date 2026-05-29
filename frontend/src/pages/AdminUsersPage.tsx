import { useState } from "react"
import AppShell from "../components/AppShell"
import SubBar from "../components/SubBar"
import { useAdminUsers, useAdminUserDetail, useDeleteUser } from "../hooks/useAdminUsers"
import { useToast } from "../contexts/ToastContext"
import { fileTypeMeta } from "../lib/fileTypes"
import { formatNombre, formatOctets, formatDateCourte, formatRelatif } from "../lib/format"
import type { UtilisateurAdminRow, UtilisateurAdminDetail } from "../types"

type RoleFiltre = 'tous' | 'admin' | 'user'

function initiales(nom: string): string {
  return nom.split(' ').map(m => m[0] ?? '').slice(0, 2).join('').toUpperCase() || '—'
}

function formatEuro(n: number): string {
  return `${n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
}

function AdminUsersPage() {
  const { users, isLoading } = useAdminUsers()
  const [roleFiltre, setRoleFiltre] = useState<RoleFiltre>('tous')
  const [recherche, setRecherche] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const nbAdmins = users.filter(u => u.role === 'admin').length
  const nbUsers = users.length - nbAdmins

  const filtres = users.filter(u => {
    if (roleFiltre !== 'tous' && u.role !== roleFiltre) return false
    const q = recherche.trim().toLowerCase()
    if (q && !u.nom.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false
    return true
  })

  const tabs: { cle: RoleFiltre; label: string }[] = [
    { cle: 'tous',  label: `tous · ${users.length}` },
    { cle: 'admin', label: `admin · ${nbAdmins}` },
    { cle: 'user',  label: `user · ${nbUsers}` },
  ]

  return (
    <AppShell>
      <div className="flex-1 flex flex-col min-h-0 relative">
        <SubBar>
          <div className="font-mono text-[11px] text-mute">admin · <b className="text-bright font-medium">utilisateurs</b></div>
        </SubBar>

        {/* Toolbar */}
        <div className="h-12 shrink-0 hair-b flex items-center gap-2.5 px-6">
          <div className="flex items-center gap-2 flex-1 max-w-[360px]">
            <span className="material-symbols-outlined text-[16px] text-mute">search</span>
            <input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="filtrer par nom ou email…"
              className="flex-1 bg-transparent border-0 text-[12.5px] text-bright outline-none placeholder:text-mute"
            />
          </div>
          <div className="ml-auto flex hair">
            {tabs.map(t => (
              <button
                key={t.cle}
                type="button"
                onClick={() => setRoleFiltre(t.cle)}
                className={`px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider hair-r last:border-r-0 transition-colors ${
                  roleFiltre === t.cle ? 'text-bright bg-elev' : 'text-soft hover:text-bright hover:bg-elev'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="font-mono text-[11px] text-mute px-6 py-8">Chargement des utilisateurs…</div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="font-mono text-[9.5px] uppercase tracking-wider text-mute">
                  <th className="text-left px-6 py-2.5 hair-b sticky top-0 bg-ink font-medium">Utilisateur</th>
                  <th className="text-left px-6 py-2.5 hair-b sticky top-0 bg-ink font-medium">Rôle</th>
                  <th className="text-left px-6 py-2.5 hair-b sticky top-0 bg-ink font-medium">Inscrit le</th>
                  <th className="text-right px-6 py-2.5 hair-b sticky top-0 bg-ink font-medium">Docs</th>
                  <th className="text-right px-6 py-2.5 hair-b sticky top-0 bg-ink font-medium">Tokens 30j</th>
                  <th className="text-right px-6 py-2.5 hair-b sticky top-0 bg-ink font-medium">Suggestions</th>
                  <th className="text-left px-6 py-2.5 hair-b sticky top-0 bg-ink font-medium">Dernier login</th>
                </tr>
              </thead>
              <tbody>
                {filtres.map(u => (
                  <UserRow key={u.id} u={u} selected={u.id === selectedId} onClick={() => setSelectedId(u.id)} />
                ))}
              </tbody>
            </table>
          )}
          {!isLoading && filtres.length === 0 && (
            <div className="font-mono text-[11px] text-mute px-6 py-8">Aucun utilisateur ne correspond.</div>
          )}
        </div>

        {selectedId != null && (
          <DetailPanel id={selectedId} onClose={() => setSelectedId(null)} />
        )}
      </div>
    </AppShell>
  )
}

function UserRow({ u, selected, onClick }: { u: UtilisateurAdminRow; selected: boolean; onClick: () => void }) {
  return (
    <tr onClick={onClick} className={`cursor-pointer ${selected ? 'bg-elev' : 'hover:bg-elev'}`}>
      <td className={`px-6 py-2.5 hair-b text-[12.5px] ${selected ? 'shadow-[inset_2px_0_0_var(--type-md)]' : ''}`}>
        <div className="flex items-center gap-2.5">
          <span className="w-[26px] h-[26px] bg-elev hair flex items-center justify-center font-mono text-[10px] text-soft shrink-0">{initiales(u.nom)}</span>
          <div>
            <div className="text-bright">{u.nom}</div>
            <div className="font-mono text-[10.5px] text-mute">{u.email}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-2.5 hair-b"><RolePill role={u.role} /></td>
      <td className="px-6 py-2.5 hair-b font-mono text-[11px] text-soft">{formatDateCourte(u.date_inscription)}</td>
      <td className="px-6 py-2.5 hair-b text-right font-mono text-[11.5px] text-soft tabular-nums">{u.nb_documents}</td>
      <td className="px-6 py-2.5 hair-b text-right font-mono text-[11.5px] text-soft tabular-nums">{formatNombre(u.tokens_30j)}</td>
      <td className="px-6 py-2.5 hair-b text-right font-mono text-[11.5px] text-soft tabular-nums">{u.nb_suggestions}</td>
      <td className="px-6 py-2.5 hair-b font-mono text-[11px] text-soft">{formatRelatif(u.dernier_login)}</td>
    </tr>
  )
}

function RolePill({ role }: { role: string }) {
  const admin = role === 'admin'
  return (
    <span className={`font-mono text-[9.5px] uppercase tracking-wider px-1.5 py-0.5 border-[0.5px] ${admin ? 'text-warn border-warn/40' : 'text-soft border-line2'}`}>
      {role}
    </span>
  )
}

function DetailPanel({ id, onClose }: { id: number; onClose: () => void }) {
  const { detail, isLoading } = useAdminUserDetail(id)
  const { deleteUser, isPending: isDeleting } = useDeleteUser()
  const { showToast } = useToast()
  const [confirmSuppr, setConfirmSuppr] = useState(false)

  const supprimer = async () => {
    try {
      await deleteUser(id)
      showToast("Utilisateur supprimé", 'success')
      onClose()
    } catch {
      showToast("Suppression impossible", 'error')
    }
  }

  return (
    <>
      <div className="absolute inset-0 bg-black/45 z-30" onClick={onClose} />
      <aside className="absolute top-0 right-0 bottom-0 w-[440px] bg-panel border-l-[0.5px] border-line2 z-40 flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,.4)]">
        {isLoading || !detail ? (
          <div className="font-mono text-[11px] text-mute p-5">Chargement…</div>
        ) : (
          <DetailContenu detail={detail} onClose={onClose} confirmSuppr={confirmSuppr} setConfirmSuppr={setConfirmSuppr} supprimer={supprimer} isDeleting={isDeleting} />
        )}
      </aside>
    </>
  )
}

function DetailContenu({ detail, onClose, confirmSuppr, setConfirmSuppr, supprimer, isDeleting }: {
  detail: UtilisateurAdminDetail
  onClose: () => void
  confirmSuppr: boolean
  setConfirmSuppr: (v: boolean) => void
  supprimer: () => void
  isDeleting: boolean
}) {
  const pourcent = detail.quota_octets > 0 ? Math.round((detail.stockage_octets / detail.quota_octets) * 100) : 0
  const libre = Math.max(0, detail.quota_octets - detail.stockage_octets)
  const typesDocs = Object.entries(detail.docs_par_type).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1])
  const maxType = typesDocs.length > 0 ? typesDocs[0][1] : 1

  return (
    <>
      <div className="flex items-start gap-3.5 px-5 py-4 hair-b">
        <span className="w-[46px] h-[46px] bg-elev hair flex items-center justify-center font-mono text-[15px] text-bright shrink-0">{initiales(detail.nom)}</span>
        <div className="flex-1 min-w-0">
          <div className="font-display font-semibold text-[16px]">{detail.nom}</div>
          <div className="font-mono text-[11px] text-mute my-0.5">{detail.email}</div>
          <RolePill role={detail.role} />
        </div>
        <button onClick={onClose} className="text-mute hover:text-bright transition-colors"><span className="material-symbols-outlined text-[18px]">close</span></button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Section label="Compte">
          <div className="grid grid-cols-2 gap-px bg-line hair">
            <Cell label="Inscrit le" valeur={formatDateCourte(detail.date_inscription)} mono />
            <Cell label="Dernier login" valeur={formatRelatif(detail.dernier_login)} mono />
          </div>
        </Section>

        <Section label="Stockage">
          <div className="font-display text-[18px] tabular-nums">{formatOctets(detail.stockage_octets)} <span className="text-[11px] text-mute">/ {formatOctets(detail.quota_octets)}</span></div>
          <div className="h-1.5 bg-line my-2.5 overflow-hidden"><div className="h-full bg-soft" style={{ width: `${pourcent}%` }} /></div>
          <div className="flex justify-between font-mono text-[11px] text-soft"><span>{pourcent} % utilisé</span><span>{formatOctets(libre)} libres</span></div>
        </Section>

        <Section label="Activité · 30 jours">
          <div className="grid grid-cols-2 gap-px bg-line hair">
            <Cell label="Tokens 30j" valeur={formatNombre(detail.tokens_30j)} />
            <Cell label="Coût est. 30j" valeur={formatEuro(detail.cout_estime_30j)} valeurClass="text-warn text-[16px]" />
          </div>
        </Section>

        <Section label="Suggestions de Slavy">
          <div className="grid grid-cols-3 gap-px bg-line hair">
            <Cell label="En attente" valeur={String(detail.suggestions_en_attente)} valeurClass="text-type-ai" />
            <Cell label="Validées" valeur={String(detail.suggestions_validees)} valeurClass="text-success" />
            <Cell label="Refusées" valeur={String(detail.suggestions_refusees)} valeurClass="text-danger" />
          </div>
        </Section>

        <Section label={`Documents par type · ${detail.nb_documents} + ${detail.nb_documents_corbeille} en corbeille`}>
          {typesDocs.length === 0 ? (
            <div className="font-mono text-[11px] text-mute">aucun document</div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {typesDocs.map(([type, nb]) => {
                const meta = fileTypeMeta(type)
                return (
                  <div key={type} className="flex items-center gap-2.5">
                    <span className="w-2 h-2 shrink-0" style={{ background: meta.couleur }} />
                    <span className="text-[12px] text-bright w-[70px]">{meta.label}</span>
                    <span className="flex-1 h-0.5 bg-line overflow-hidden"><span className="block h-full" style={{ width: `${Math.round((nb / maxType) * 100)}%`, background: meta.couleur }} /></span>
                    <span className="font-mono text-[10.5px] text-soft">{nb}</span>
                  </div>
                )
              })}
            </div>
          )}
        </Section>

        <Section label="Organisation">
          <div className="grid grid-cols-3 gap-px bg-line hair">
            <Cell label="Dossiers" valeur={String(detail.nb_categories)} />
            <Cell label="Tags" valeur={String(detail.nb_tags)} />
            <Cell label="Corbeille" valeur={String(detail.nb_documents_corbeille)} />
          </div>
        </Section>
      </div>

      <div className="px-5 py-3.5 hair-t flex gap-2">
        {confirmSuppr ? (
          <>
            <button onClick={() => setConfirmSuppr(false)} className="flex-1 text-[12px] text-soft border-[0.5px] border-line2 py-2.5 hover:bg-elev transition-colors">Annuler</button>
            <button onClick={supprimer} disabled={isDeleting} className="flex-1 text-[12px] text-danger border-[0.5px] border-danger/40 py-2.5 hover:bg-danger/10 transition-colors disabled:opacity-50">
              {isDeleting ? 'Suppression…' : 'Confirmer la suppression'}
            </button>
          </>
        ) : (
          <button onClick={() => setConfirmSuppr(true)} className="ml-auto inline-flex items-center gap-1.5 text-[12px] text-danger border-[0.5px] border-danger/40 px-3 py-2.5 hover:bg-danger/10 transition-colors">
            <span className="material-symbols-outlined text-[15px]">person_remove</span> Supprimer
          </button>
        )}
      </div>
    </>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-5 py-4 hair-b">
      <div className="section-label mb-3">{label}</div>
      {children}
    </div>
  )
}

function Cell({ label, valeur, valeurClass = '', mono }: { label: string; valeur: string; valeurClass?: string; mono?: boolean }) {
  return (
    <div className="bg-panel p-3">
      <div className={`${mono ? 'font-mono text-[13px]' : 'font-display font-medium text-[18px]'} tabular-nums leading-none ${valeurClass}`}>{valeur}</div>
      <div className="font-mono text-[9px] uppercase tracking-wider text-mute mt-1.5">{label}</div>
    </div>
  )
}

export default AdminUsersPage
