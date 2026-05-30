import { fileTypeMeta } from "../lib/fileTypes"

type Props = {
  type: string | null | undefined
  size?: number
  className?: string
}

// Icône Material colorée selon le type de fichier. Source unique : lib/fileTypes.
// On force un rendu PLEIN (FILL 1) + un peu plus gras que le chrome (wght 400) :
// le logo de type doit ressortir comme un vrai badge, pas comme une icône d'UI fine.
function TypeIcon({ type, size = 18, className = "" }: Props) {
  const meta = fileTypeMeta(type)
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{
        fontSize: size,
        color: meta.couleur,
        fontVariationSettings: '"FILL" 1, "wght" 400, "GRAD" 0, "opsz" 20',
      }}
    >
      {meta.icone}
    </span>
  )
}

export default TypeIcon
