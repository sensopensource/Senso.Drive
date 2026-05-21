import { apiFetch } from "../api"
import { useQuery } from "@tanstack/react-query"
import type { TokensStats } from "../types"

export function useAdminTokens(jours: number | null) {
  const { data, isLoading } = useQuery<TokensStats>({
    queryKey: ['admin', 'tokens', jours],
    queryFn: async () => {
      const suffixe = jours == null ? '' : `?jours=${jours}`
      const response = await apiFetch(`/admin/tokens${suffixe}`)
      if (!response.ok) throw new Error("Erreur chargement tokens")
      return response.json()
    },
  })

  return {
    tokens: data ?? null,
    isLoading,
  }
}
