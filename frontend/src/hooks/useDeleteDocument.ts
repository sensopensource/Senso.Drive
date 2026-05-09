import { apiFetch } from "../api"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "../contexts/ToastContext"

export function useDeleteDocument() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const mutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiFetch(`/documents/${id}/corbeille`, {
        method: 'POST',
      })
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.detail || "Erreur suppression")
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['corbeille'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      showToast("Document déplacé dans la corbeille", 'success')
    },
    onError: (error) => {
      showToast(error.message, 'error')
    },
  })

  return {
    deleteDocument: mutation.mutate,
    isPending: mutation.isPending,
  }
}
