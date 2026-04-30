import { apiFetch } from "../api"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "../contexts/ToastContext"

export function useDeleteCategorie() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const mutation = useMutation({
    mutationFn: async (id_categorie: number) => {
      const response = await apiFetch(`/categories/${id_categorie}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.detail || "Erreur suppression")
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      showToast("Categorie supprimé", 'success')
    },
    onError: (error) => {
      showToast(error.message, 'error')
    },
  })

  return {
    deleteCategorie: mutation.mutate,
    isPending: mutation.isPending,
  }
}
