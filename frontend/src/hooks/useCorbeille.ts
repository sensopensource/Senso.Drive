import { apiFetch } from "../api"
import { useQuery } from "@tanstack/react-query"
import type { DocumentListResponse } from "../types"

export function useCorbeille(page: number = 1, size: number = 20) {
  const { data, isLoading, error } = useQuery<DocumentListResponse>({
    queryKey: ['corbeille', page, size],
    queryFn: async () => {
      const response = await apiFetch(`/documents/corbeille?page=${page}&size=${size}`)
      if (!response.ok) throw new Error("Erreur fetch corbeille")
      return response.json()
    },
  })

  return {
    documents: data?.items ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
  }
}
