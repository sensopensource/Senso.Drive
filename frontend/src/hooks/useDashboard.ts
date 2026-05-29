import { apiFetch } from "../api"
import { useQuery } from "@tanstack/react-query"
import type { DashboardUtilisateur } from "../types"

export function useDashboard() {
  const { data, isLoading, error } = useQuery<DashboardUtilisateur>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await apiFetch('/dashboard')
      if (!response.ok) throw new Error("Erreur fetch dashboard")
      return response.json()
    },
  })

  return {
    documentsTotal: data?.documents_total ?? 0,
    docsParType: data?.docs_par_type ?? {},
    suggestionsEnAttente: data?.suggestions_en_attente ?? 0,
    isLoading,
    error,
  }
}
