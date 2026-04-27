import { apiFetch } from "../api"
import { useMutation, useQueryClient } from "@tanstack/react-query"

export function useDeleteDocument() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiFetch(`/documents/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.detail || "Erreur suppression")
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })

  return {
    deleteDocument: mutation.mutate,
    isPending: mutation.isPending,
  }
}
