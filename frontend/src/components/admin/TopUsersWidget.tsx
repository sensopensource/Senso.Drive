import Widget from "./Widget"
import { useAdminUsers } from "../../hooks/useAdminUsers"
import { formatNombre } from "../../lib/format"

type Props = {
  className?: string
}

function initiales(nom: string): string {
  return nom.slice(0, 2).toUpperCase()
}

function TopUsersWidget({ className }: Props) {
  const { users, isLoading } = useAdminUsers()

  const top = [...users]
    .sort((a, b) => b.nb_documents - a.nb_documents)
    .slice(0, 5)
  const max = Math.max(...top.map(u => u.nb_documents), 1)

  return (
    <Widget
      title="Top users — docs"
      icon="leaderboard"
      className={className}
      bodyFlush
      footer={<span>{users.length} user{users.length > 1 ? 's' : ''} au total</span>}
    >
      {isLoading ? (
        <div className="p-3.5 font-mono text-[10.5px] text-mute">Chargement…</div>
      ) : top.length === 0 ? (
        <div className="p-3.5 font-mono text-[10.5px] text-mute">Aucun utilisateur</div>
      ) : (
        <div className="flex flex-col">
          {top.map(u => (
            <div key={u.id} className="grid grid-cols-[1fr_auto] gap-2.5 px-3.5 py-2 hair-b last:border-b-0 hover:bg-elev items-center">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-[22px] h-[22px] bg-elev hair flex items-center justify-center font-mono text-[10px] text-soft shrink-0">
                  {initiales(u.nom)}
                </div>
                <span className="text-[12.5px] text-bright truncate">{u.nom}</span>
                {u.role === 'admin' && (
                  <span className="font-mono text-[9px] uppercase tracking-wider text-type-md px-1.5 hair">admin</span>
                )}
              </div>
              <span className="font-mono text-[11px] text-soft tabular-nums">{formatNombre(u.nb_documents)} docs</span>
              <div className="col-span-2 h-0.5 bg-line mt-1.5 overflow-hidden">
                <div className="h-full bg-soft" style={{ width: `${(u.nb_documents / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Widget>
  )
}

export default TopUsersWidget
