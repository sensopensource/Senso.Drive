import { apiFetch } from "../api"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { UtilisateurAdminRow } from "../types"

export function useAdminUsers() {
  const { data, isLoading } = useQuery<UtilisateurAdminRow[]>({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const response = await apiFetch('/admin/users')
      if (!response.ok) throw new Error("Erreur chargement utilisateurs")
      return response.json()
    },
  })

  return {
    users: data ?? [],
    isLoading,
  }
}

export function useDeleteUser() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiFetch(`/admin/users/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error("Erreur suppression utilisateur")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] })
    },
  })

  return {
    deleteUser: mutation.mutateAsync,
    isPending: mutation.isPending,
  }
}
