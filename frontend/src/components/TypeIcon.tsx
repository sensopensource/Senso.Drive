import { fileTypeMeta } from "../lib/fileTypes"

type Props = {
  type: string | null | undefined
  size?: number
  className?: string
}

// Icône Material colorée selon le type de fichier. Source unique : lib/fileTypes.
function TypeIcon({ type, size = 18, className = "" }: Props) {
  const meta = fileTypeMeta(type)
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{ fontSize: size, color: meta.couleur }}
    >
      {meta.icone}
    </span>
  )
}

export default TypeIcon
