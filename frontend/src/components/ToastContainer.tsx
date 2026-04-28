import { useToast, type Toast } from "../contexts/ToastContext"

// Mapping type → classe couleur + icone
const TYPE_CONFIG: Record<Toast['type'], { icon: string; colorClass: string }> = {
  success: { icon: 'check_circle',  colorClass: 'text-success' },
  error:   { icon: 'error_outline', colorClass: 'text-danger' },
  info:    { icon: 'info',          colorClass: 'text-fg-2' },
}

function ToastContainer() {
  const { toasts, removeToast } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map(toast => {
        const config = TYPE_CONFIG[toast.type]
        return (
          <div
            key={toast.id}
            className="flex items-center gap-3 bg-surface-2 border border-border px-4 py-3 shadow-lg"
          >
            <span className={`material-symbols-outlined text-base ${config.colorClass}`}>
              {config.icon}
            </span>
            <span className="font-body text-sm text-fg-1 flex-1">
              {toast.message}
            </span>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-fg-3 hover:text-fg-1 transition-colors"
              aria-label="Fermer"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        )
      })}
    </div>
  )
}

export default ToastContainer
