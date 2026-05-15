import { apiFetch } from "../api"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

export type SuggestionDoc = {
  type: string
  title: string
  cat: string
}

export type SuggestionPayload = {
  type: string
  title: string
  why: string
  docs: SuggestionDoc[]
  reorgDesc?: string
}

export type Suggestion = {
  id: number
  id_utilisateur: number
  type: string
  payload: SuggestionPayload
  statut: 'en_attente' | 'validee' | 'refusee'
  raison_refus: string | null
  date_creation: string
  date_traitement: string | null
}

export function useSuggestions() {
  const { data, isLoading } = useQuery<Suggestion[]>({
    queryKey: ['suggestions'],
    queryFn: async () => {
      const response = await apiFetch('/agent/suggestions')
      if (!response.ok) throw new Error("Erreur chargement suggestions")
      return response.json()
    },
  })

  return {
    suggestions: data ?? [],
    isLoading,
  }
}

export function useAnalyserAgent() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await apiFetch('/agent/analyser', { method: 'POST' })
      if (!response.ok) throw new Error("Erreur lancement analyse")
      return response.json() as Promise<Suggestion[]>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggestions'] })
    },
  })

  return {
    analyser: mutation.mutateAsync,
    isPending: mutation.isPending,
  }
}

export function useValiderSuggestion() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiFetch(`/agent/suggestions/${id}/valider`, { method: 'POST' })
      if (!response.ok) throw new Error("Erreur validation suggestion")
      return response.json() as Promise<Suggestion>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggestions'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })

  return {
    valider: mutation.mutateAsync,
    isPending: mutation.isPending,
  }
}

export function useRefuserSuggestion() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (payload: { id: number; raison_refus: string | null }) => {
      const response = await apiFetch(`/agent/suggestions/${payload.id}/refuser`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raison_refus: payload.raison_refus }),
      })
      if (!response.ok) throw new Error("Erreur refus suggestion")
      return response.json() as Promise<Suggestion>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggestions'] })
    },
  })

  return {
    refuser: mutation.mutateAsync,
    isPending: mutation.isPending,
  }
}
