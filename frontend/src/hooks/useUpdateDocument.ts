import { apiFetch } from "../api"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "../contexts/ToastContext"
import type { Document } from "../types"

type UpdateParams = {
  id: number
  titre?: string
  auteur?: string
}

export function useUpdateDocument() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const mutation = useMutation({
    mutationFn: async ({ id, titre, auteur }: UpdateParams) => {
      const body: Record<string, string> = {}
      if (titre !== undefined) body.titre = titre
      if (auteur !== undefined) body.auteur = auteur

      const response = await apiFetch(`/documents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.detail || "Erreur modification")
      }

      return response.json() as Promise<Document>
    },
    onSuccess: (data, variables) => {
      // Invalide la liste ET le detail de ce doc precis
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['document', variables.id] })
      showToast(`Document renommé en "${data.titre}"`, 'success')
    },
    onError: (error) => {
      showToast(error.message, 'error')
    },
  })

  return {
    updateDocument: mutation.mutate,
    isPending: mutation.isPending,
  }
}
