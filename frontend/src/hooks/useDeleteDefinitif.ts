import { apiFetch } from "../api"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "../contexts/ToastContext"

export function useDeleteDefinitif() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiFetch(`/documents/${id}/definitif`, { method: 'DELETE' })
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.detail || "Erreur suppression")
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['corbeille'] })
      showToast("Document supprimé définitivement", 'success')
    },
    onError: (error: Error) => {
      showToast(error.message, 'error')
    },
  })
}
