import { apiFetch } from "../api"
import { useQuery } from "@tanstack/react-query"
import type { OverviewKpis } from "../types"

// jours = null → tout l'historique (le back interprete l'absence du param)
export function useOverview(jours: number | null) {
  const { data, isLoading } = useQuery<OverviewKpis>({
    queryKey: ['admin', 'overview', jours],
    queryFn: async () => {
      const suffixe = jours == null ? '' : `?jours=${jours}`
      const response = await apiFetch(`/admin/overview${suffixe}`)
      if (!response.ok) throw new Error("Erreur chargement overview")
      return response.json()
    },
  })

  return {
    overview: data ?? null,
    isLoading,
  }
}
