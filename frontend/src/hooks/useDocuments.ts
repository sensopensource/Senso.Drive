import { apiFetch } from "../api"
import type { Document } from "../types"
import { useQuery } from "@tanstack/react-query"

export function useDocuments() {
  const { data, isLoading, error } = useQuery<Document[]>({
    queryKey: ['documents'],
    queryFn: async () => {
      const response = await apiFetch("/documents")
      if (!response.ok) throw new Error("Erreur fetch documents")
      const data = await response.json()
      return data
    }
  })

  return {
    documents: data ?? [],
    isLoading,
    error,
  }
}
