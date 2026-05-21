import { type ReactNode } from "react"

type Props = {
  title: string
  icon: string                 // nom d'un material symbol (ex: "memory")
  iconClass?: string           // accent couleur de l'icone (ex: "text-type-ai")
  counter?: ReactNode          // petit compteur a droite du titre
  actions?: ReactNode          // boutons d'action (apparaissent au hover)
  footer?: ReactNode
  bodyFlush?: boolean          // body sans padding (pour tables / listes pleine largeur)
  className?: string           // span de colonne (ex: "col-span-8")
  children: ReactNode
}

// Coquille generique d'un widget de dashboard : on separe le chassis repete
// (header + body + footer) du contenu, qui est passe en children.
function Widget({ title, icon, iconClass = "text-mute", counter, actions, footer, bodyFlush, className = "", children }: Props) {
  return (
    <section className={`group bg-panel hair flex flex-col min-w-0 ${className}`}>
      <div className="hair-b flex items-center gap-2.5 px-3.5 min-h-[38px]">
        <span className="section-label flex-1 flex items-center gap-2">
          <span className={`material-symbols-outlined text-[13px] ${iconClass}`}>{icon}</span>
          {title}
        </span>
        {counter != null && (
          <span className="font-mono text-[10.5px] text-soft">{counter}</span>
        )}
        {actions != null && (
          <span className="flex gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
            {actions}
          </span>
        )}
      </div>

      <div className={`flex-1 min-w-0 ${bodyFlush ? '' : 'p-3.5'}`}>
        {children}
      </div>

      {footer != null && (
        <div className="hair-t px-3.5 py-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-mute">
          {footer}
        </div>
      )}
    </section>
  )
}

export default Widget
