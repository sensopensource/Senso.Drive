import { apiFetch } from "../api"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "../contexts/ToastContext"
import type { Document } from "../types"

export function useAddVersion(documentId: number) {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)

      const response = await apiFetch(`/documents/${documentId}/versions`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.detail || "Erreur upload")
      }

      return response.json() as Promise<Document>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', documentId] })
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['versions', documentId] })
      showToast("Nouvelle version uploadée", 'success')
    },
    onError: (error: Error) => {
      showToast(error.message, 'error')
    },
  })
}
