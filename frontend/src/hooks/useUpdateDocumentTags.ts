import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../api'
import { useToast } from '../contexts/ToastContext'

export function useUpdateDocumentTags(documentId: number) {
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (tagIds: number[]) => {
      const response = await apiFetch(`/documents/${documentId}/tags`, {
        method: 'PATCH',
        body: JSON.stringify({ tag_ids: tagIds }),
        headers: { 'Content-Type': 'application/json' },
      })
      if (!response.ok) throw new Error('Erreur modification tags')
      return response.json()
    },
    onSuccess: () => {
      showToast('Tags modifiés', 'success')
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['document', documentId] })
    },
    onError: () => {
      showToast('Erreur modification tags', 'error')
    },
  })
}
