import { apiFetch } from "../api"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

// Forme libre stockee dans le JSONB `layout` cote back. On la definit cote front.
export type DashboardLayoutData = {
  order: string[]
  hidden: string[]
  spans: Record<string, number>   // cle widget → largeur en colonnes
}

type DashboardLayoutResponse = {
  layout: DashboardLayoutData | null
}

export function useDashboardLayout() {
  const { data, isLoading } = useQuery<DashboardLayoutResponse>({
    queryKey: ['preferences', 'dashboard'],
    queryFn: async () => {
      const response = await apiFetch('/preferences/dashboard')
      if (!response.ok) throw new Error("Erreur chargement layout")
      return response.json()
    },
  })

  return {
    layout: data?.layout ?? null,
    isLoading,
  }
}

export function useSaveDashboardLayout() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (layout: DashboardLayoutData) => {
      const response = await apiFetch('/preferences/dashboard', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layout }),
      })
      if (!response.ok) throw new Error("Erreur sauvegarde layout")
      return response.json()
    },
    onSuccess: (data) => {
      // On garde le cache aligne sans refetch (la reponse renvoie le layout enregistre)
      queryClient.setQueryData(['preferences', 'dashboard'], data)
    },
  })

  return {
    saveLayout: mutation.mutate,
  }
}
