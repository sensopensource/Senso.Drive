import { apiFetch } from "../api"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "../contexts/ToastContext"

export function useViderCorbeille() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  return useMutation({
    mutationFn: async () => {
      const response = await apiFetch(`/documents/corbeille`, { method: 'DELETE' })
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.detail || "Erreur suppression")
      }
      return response.json() as Promise<{ message: string }>
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['corbeille'] })
      showToast(data.message, 'success')
    },
    onError: (error: Error) => {
      showToast(error.message, 'error')
    },
  })
}
