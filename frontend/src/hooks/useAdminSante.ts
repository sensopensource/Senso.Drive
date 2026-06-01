import { apiFetch } from "../api"
import { useQuery } from "@tanstack/react-query"
import type { SanteStats } from "../types"

export function useAdminSante(jours: number | null) {
  const { data, isLoading } = useQuery<SanteStats>({
    queryKey: ['admin', 'sante', jours],
    queryFn: async () => {
      const suffixe = jours == null ? '' : `?jours=${jours}`
      const response = await apiFetch(`/admin/sante${suffixe}`)
      if (!response.ok) throw new Error("Erreur chargement santé LLM")
      return response.json()
    },
  })

  return {
    sante: data ?? null,
    isLoading,
  }
}
