import { apiFetch } from "../api"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { Document } from "../types"

type UploadParams = {
  file: File
  titre?: string
  auteur?: string
  id_categorie?: number | null
}

export function useUploadDocument() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async ({ file, titre, auteur, id_categorie }: UploadParams) => {
      const formData = new FormData()
      formData.append('file', file)
      if (titre) formData.append('titre', titre)
      if (auteur) formData.append('auteur', auteur)
      if (id_categorie != null) {
        formData.append('id_categorie', String(id_categorie))
      }

      const response = await apiFetch("/documents/", {
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
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })

  return {
    uploadDocument: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error,
  }
}
