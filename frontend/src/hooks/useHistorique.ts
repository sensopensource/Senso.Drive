import { apiFetch } from "../api"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

export type HistoriqueRecherche = {
  id: number
  requete: string
  date_recherche: string
  nb_resultats: number
}

export function useHistorique() {
  const { data, isLoading } = useQuery<HistoriqueRecherche[]>({
    queryKey: ['historiques'],
    queryFn: async () => {
      const response = await apiFetch('/historiques/')
      if (!response.ok) throw new Error("Erreur chargement historique")
      return response.json()
    },
  })

  return {
    historique: data ?? [],
    isLoading,
  }
}

export function useCreateHistorique() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (payload: { requete: string; nb_resultats: number }) => {
      const response = await apiFetch('/historiques/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) throw new Error("Erreur enregistrement historique")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['historiques'] })
    },
  })

  return {
    createHistorique: mutation.mutate,
  }
}

export function useDeleteHistorique() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiFetch(`/historiques/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error("Erreur suppression entrée")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['historiques'] })
    },
  })

  return {
    deleteHistorique: mutation.mutate,
  }
}

export function useViderHistorique() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await apiFetch('/historiques/', { method: 'DELETE' })
      if (!response.ok) throw new Error("Erreur vidage historique")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['historiques'] })
    },
  })

  return {
    viderHistorique: mutation.mutate,
  }
}
