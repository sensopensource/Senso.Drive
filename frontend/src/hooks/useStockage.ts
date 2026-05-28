import { apiFetch } from "../api"
import { useQuery } from "@tanstack/react-query"
import type { StockageUtilisateur } from "../types"

export function useStockage() {
  const { data, isLoading, error } = useQuery<StockageUtilisateur>({
    queryKey: ['stockage'],
    queryFn: async () => {
      const response = await apiFetch('/documents/stockage')
      if (!response.ok) throw new Error("Erreur fetch stockage")
      return response.json()
    },
  })

  return {
    utilise: data?.utilise_octets ?? 0,
    quota: data?.quota_octets ?? 0,
    isLoading,
    error,
  }
}
