import { useQuery } from '@tanstack/react-query'
import type { Tag } from '../types'
import { apiFetch } from '../api'

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const response = await apiFetch("/tags/", { method: 'GET' })
      if (!response.ok) throw new Error('Erreur fetch tags')
      return (await response.json()) as Tag[]
    },
  })
}
