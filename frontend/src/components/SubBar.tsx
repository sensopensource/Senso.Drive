import { type ReactNode } from "react"

// Sous-barre d'écran (56px) : fil d'Ariane à gauche, outils à droite (via ml-auto).
// Brique partagée par les écrans qui vivent dans AppShell.
type Props = {
  children: ReactNode
}

function SubBar({ children }: Props) {
  return (
    <div className="h-14 shrink-0 hair-b flex items-center px-6 gap-4">
      {children}
    </div>
  )
}

export default SubBar
