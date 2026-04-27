import { apiFetch } from "../api"
import { useQuery } from "@tanstack/react-query"
import type { DocumentDetail } from "../types"

export function useDocument(id: number | null) {
  const { data, isLoading, error } = useQuery<DocumentDetail>({
    queryKey: ['document', id],
    queryFn: async () => {
      const response = await apiFetch(`/documents/${id}`)
      if (!response.ok) throw new Error("Erreur fetch document")
      return response.json()
    },
    enabled: id !== null,
  })

  return {
    document: data,
    isLoading,
    error,
  }
}
