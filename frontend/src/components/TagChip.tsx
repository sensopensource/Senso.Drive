import type { Tag } from '../types'

interface TagChipProps {
  tag: Tag
  removable?: boolean
  onRemove?: () => void
}

export function TagChip({ tag, removable, onRemove }: TagChipProps) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono uppercase tracking-wider text-fg-1 border"
      style={{
        backgroundColor: tag.color,
        borderColor: tag.color,
      }}
    >
      <span className="truncate max-w-[120px]">{tag.name}</span>
      {removable && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove?.()
          }}
          className="text-fg-1/70 hover:text-fg-1 transition-colors leading-none"
          aria-label={`Supprimer ${tag.name}`}
        >
          ✕
        </button>
      )}
    </span>
  )
}
