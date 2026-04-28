
import { apiFetch } from "../api"
import type { Categorie } from "../types"
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query"
import { useToast } from "../contexts/ToastContext"

export function useCategories() {

  const queryClient = useQueryClient()
  const { showToast } = useToast()


  const {data,isLoading,error} = useQuery<Categorie[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await apiFetch("/categories")
      if(!response.ok) throw new Error("pas de categories")
      const data = await response.json()
      return data
    }
  })

   const addMutation = useMutation({
    mutationFn: async (nom: string) => {
      const response = await apiFetch(`/categories?nom=${encodeURIComponent(nom)}`,{'method':'POST',})
      if (!response.ok) throw new Error("ajout impossible")
      return response.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({queryKey: ['categories']})
      showToast(`Catégorie "${data.nom}" créée`, 'success')
    },
    onError: (error) => {
      showToast(error.message, 'error')
    }
   })

   const updateMutation = useMutation({
    mutationFn: async (categorie: Categorie) => {
      const response = await apiFetch(`/categories?id_categorie=${categorie.id}&nom=${encodeURIComponent(categorie.nom)}`,
      { method: "PATCH" })
      if (!response.ok) throw new Error("modification impossible")
      return response.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({queryKey: ['categories']})
      showToast(`Catégorie renommée en "${data.nom}"`, 'success')
    },
    onError: (error) => {
      showToast(error.message, 'error')
    }
   })
  return {
    categories: data ?? [],
    isLoading,
    error,
    addCategorie: (nom: string) => {addMutation.mutate(nom)},
    updateCategorie: (categorie: Categorie) => {updateMutation.mutate(categorie)}
    }
} 
