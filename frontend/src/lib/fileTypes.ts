// Métadonnées d'affichage par type de fichier : icône Material Symbols + couleur + libellé.
// Source unique pour tout l'UI (lignes, cartes, aperçu, upload). Le back renvoie `type_fichier`
// en minuscules : "pdf" | "docx" | "txt" | "md" | "jpg" | "png".

export type FileTypeMeta = {
  icone: string    // nom d'icône Material Symbols
  couleur: string  // valeur CSS (var(--type-*))
  label: string    // libellé humain affiché
}

const META: Record<string, FileTypeMeta> = {
  pdf:  { icone: "picture_as_pdf", couleur: "var(--type-pdf)",  label: "PDF" },
  docx: { icone: "description",    couleur: "var(--type-docx)", label: "Word" },
  txt:  { icone: "article",        couleur: "var(--type-txt)",  label: "Texte" },
  md:   { icone: "article",        couleur: "var(--type-md)",   label: "Markdown" },
  jpg:  { icone: "image",          couleur: "var(--type-img)",  label: "Image" },
  jpeg: { icone: "image",          couleur: "var(--type-img)",  label: "Image" },
  png:  { icone: "image",          couleur: "var(--type-img)",  label: "Image" },
}

const FALLBACK: FileTypeMeta = {
  icone: "insert_drive_file",
  couleur: "var(--mute)",
  label: "Fichier",
}

export function fileTypeMeta(type: string | null | undefined): FileTypeMeta {
  if (!type) return FALLBACK
  return META[type.toLowerCase()] ?? FALLBACK
}

// Types acceptés à l'upload (= clés connues) → filtre `accept` + validation client (#12).
export const TYPES_ACCEPTES = Object.keys(META)
export const ACCEPT_ATTR = TYPES_ACCEPTES.map(t => `.${t}`).join(',')

export function estFormatAccepte(type: string | null | undefined): boolean {
  return !!type && type.toLowerCase() in META
}

// "image" si le type est une image (jpg/jpeg/png) — pour la note « Slavy l'analysera ».
export function estImage(type: string | null | undefined): boolean {
  if (!type) return false
  return fileTypeMeta(type).label === "Image"
}
