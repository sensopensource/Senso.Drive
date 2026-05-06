import { apiFetch } from "../api"
import { useQuery } from "@tanstack/react-query"
import type { Version } from "../types"

export function useVersions(documentId: number | null) {
  const { data, isLoading, error } = useQuery<Version[]>({
    queryKey: ['versions', documentId],
    queryFn: async () => {
      const response = await apiFetch(`/documents/${documentId}/versions`)
      if (!response.ok) throw new Error("Erreur fetch versions")
      return response.json()
    },
    enabled: documentId !== null,
  })

  return {
    versions: data ?? [],
    isLoading,
    error,
  }
}
