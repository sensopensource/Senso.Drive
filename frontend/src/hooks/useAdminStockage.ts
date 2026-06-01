import { apiFetch } from "../api"
import { useQuery } from "@tanstack/react-query"
import type { StockageStats } from "../types"

export function useAdminStockage(jours: number | null) {
  const { data, isLoading } = useQuery<StockageStats>({
    queryKey: ['admin', 'stockage', jours],
    queryFn: async () => {
      const suffixe = jours == null ? '' : `?jours=${jours}`
      const response = await apiFetch(`/admin/stockage${suffixe}`)
      if (!response.ok) throw new Error("Erreur chargement stockage")
      return response.json()
    },
  })

  return {
    stockage: data ?? null,
    isLoading,
  }
}
