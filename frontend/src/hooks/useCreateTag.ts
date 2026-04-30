import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../api'
import { useToast } from '../contexts/ToastContext'
import type { Tag } from '../types'

export function useCreateTag() {
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  return useMutation<Tag, Error, string>({
    mutationFn: async (name) => {
      const response = await apiFetch("/tags/", {
        method: 'POST',
        body: JSON.stringify({ name }),
        headers: { 'Content-Type': 'application/json' },
      })
      if (!response.ok) throw new Error('Erreur création tag')
      return response.json() as Promise<Tag>
    },
    onSuccess: () => {
      showToast('Tag créé', 'success')
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
    onError: () => {
      showToast('Erreur création tag', 'error')
    },
  })
}
