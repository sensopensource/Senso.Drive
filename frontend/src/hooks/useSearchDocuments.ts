import { apiFetch } from "../api"
import { useQuery } from "@tanstack/react-query"
import type { DocumentSearchResult } from "../types"

export type SearchFilters = {
  type_fichier?: string | null
  auteur?: string | null
  id_categorie?: number | null
  id_tags?: number[] | null
  date_debut?: string | null  // ISO yyyy-mm-dd
  date_fin?: string | null
}

function buildSearchParams(query: string, filters: SearchFilters): string {
  const params = new URLSearchParams()
  if (query) params.set('query', query)
  if (filters.type_fichier) params.set('type_fichier', filters.type_fichier)
  if (filters.auteur) params.set('auteur', filters.auteur)
  if (filters.id_categorie != null) params.set('id_categorie', String(filters.id_categorie))
  if (filters.id_tags && filters.id_tags.length > 0) {
    filters.id_tags.forEach(id => params.append('id_tags', String(id)))
  }
  if (filters.date_debut) params.set('date_debut', filters.date_debut)
  if (filters.date_fin) params.set('date_fin', filters.date_fin)
  return params.toString()
}

function hasAnyCriteria(query: string, filters: SearchFilters): boolean {
  if (query) return true
  if (filters.type_fichier) return true
  if (filters.auteur) return true
  if (filters.id_categorie != null) return true
  if (filters.id_tags && filters.id_tags.length > 0) return true
  if (filters.date_debut) return true
  if (filters.date_fin) return true
  return false
}

export function useSearchDocuments(query: string, filters: SearchFilters = {}) {
  const enabled = hasAnyCriteria(query, filters)
  const queryString = buildSearchParams(query, filters)

  const { data, isLoading, error } = useQuery<DocumentSearchResult[]>({
    queryKey: ['documents', 'search', queryString],
    queryFn: async () => {
      const response = await apiFetch(`/documents/search?${queryString}`)
      if (!response.ok) throw new Error("Erreur recherche")
      return response.json()
    },
    enabled,
  })

  return {
    results: data ?? [],
    isLoading,
    error,
  }
}
