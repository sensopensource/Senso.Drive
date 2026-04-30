import type { Document } from "../types"
import { TagChip } from "./TagChip"

type Props = {
  document: Document
  onClick: () => void
  extrait?: string | null   // affiche sous le titre quand fourni (cas recherche)
}

// Map type_fichier → icône Material Symbol + classe Tailwind couleur
const TYPE_CONFIG: Record<string, { icon: string; colorClass: string }> = {
  pdf:  { icon: "picture_as_pdf", colorClass: "text-pdf" },
  docx: { icon: "description",    colorClass: "text-docx" },
  txt:  { icon: "text_snippet",   colorClass: "text-txt" },
  md:   { icon: "article",        colorClass: "text-md" },
}

const DEFAULT_CONFIG = { icon: "insert_drive_file", colorClass: "text-fg-3" }

function DocumentRow({ document, onClick, extrait }: Props) {
  const config = document.type_fichier
    ? TYPE_CONFIG[document.type_fichier] ?? DEFAULT_CONFIG
    : DEFAULT_CONFIG

  // Format de la date en YYYY-MM-DD selon le design system
  const dateFormatted = new Date(document.date_creation)
    .toISOString()
    .slice(0, 10)

  return (
    <li
      onClick={onClick}
      className="flex items-center justify-between gap-4 px-3 py-2 hover:bg-surface-2 transition-colors cursor-pointer"
    >

      {/* Icône colorée selon le type */}
      <span className={`material-symbols-outlined text-base ${config.colorClass} mt-0.5`}>
        {config.icon}
      </span>

      {/* Titre + auteur ou extrait + tags */}
      <div className="flex-1 min-w-0">
        <div className="font-body text-sm text-fg-1 truncate">
          {document.titre}
        </div>

        {/* Si on a un extrait (mode recherche) → on l'affiche, surligné en HTML */}
        {extrait ? (
          <div
            className="font-body text-xs text-fg-2 mt-1 line-clamp-2 [&>b]:text-fg-1 [&>b]:font-semibold"
            dangerouslySetInnerHTML={{ __html: extrait }}
          />
        ) : (
          document.auteur && (
            <div className="font-mono text-xs text-fg-3 truncate">
              {document.auteur}
            </div>
          )
        )}

        {/* Tags */}
        {document.tags && document.tags.length > 0 && (
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {document.tags.slice(0, 3).map((tag) => (
              <TagChip key={tag.id} tag={tag} />
            ))}
            {document.tags.length > 3 && (
              <span className="text-xs text-fg-3 font-body">
                +{document.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Métadonnées : type + date */}
      <div className="flex items-center gap-3 font-mono text-xs text-fg-3 mt-0.5">
        {document.type_fichier && (
          <span className="uppercase tracking-wider">
            {document.type_fichier}
          </span>
        )}
        <span>{dateFormatted}</span>
      </div>

    </li>
  )
}

export default DocumentRow
