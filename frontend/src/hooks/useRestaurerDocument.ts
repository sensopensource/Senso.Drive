import { apiFetch } from "../api"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "../contexts/ToastContext"

export function useRestaurerDocument() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiFetch(`/documents/${id}/restaurer`, { method: 'POST' })
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.detail || "Erreur restauration")
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['corbeille'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      showToast("Document restauré", 'success')
    },
    onError: (error: Error) => {
      showToast(error.message, 'error')
    },
  })
}
