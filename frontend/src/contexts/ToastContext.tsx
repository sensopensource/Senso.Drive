import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

// Un toast a un id unique, un message, un type (couleur)
type ToastType = 'success' | 'error' | 'info'

export type Toast = {
  id: number
  message: string
  type: ToastType
}

type ToastContextType = {
  toasts: Toast[]
  showToast: (message: string, type?: ToastType) => void
  removeToast: (id: number) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

type ProviderProps = {
  children: ReactNode
}

// Duree d'affichage par defaut
const DEFAULT_DURATION = 3000

export function ToastProvider({ children }: ProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])

  // useCallback pour eviter de recreer la fonction a chaque render
  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    // Generer un id unique base sur le timestamp
    const id = Date.now() + Math.random()
    const toast: Toast = { id, message, type }

    setToasts(prev => [...prev, toast])

    // Auto-remove apres DEFAULT_DURATION
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, DEFAULT_DURATION)
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  )
}

// Hook custom pour utiliser le context
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast doit etre utilise dans un ToastProvider")
  }
  return context
}
