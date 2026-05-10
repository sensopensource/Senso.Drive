import { apiFetch } from "../api"
import { useQuery } from "@tanstack/react-query"

export function useAuteurs() {
  const { data, isLoading, error } = useQuery<string[]>({
    queryKey: ['auteurs'],
    queryFn: async () => {
      const response = await apiFetch('/documents/auteurs')
      if (!response.ok) throw new Error("Erreur chargement auteurs")
      return response.json()
    },
  })

  return {
    auteurs: data ?? [],
    isLoading,
    error,
  }
}
