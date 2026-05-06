import { apiFetch } from "../api"
import { useMutation, useQueryClient } from "@tanstack/react-query"

export function useAnalyserDocument(documentId: number) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (numero?: number): Promise<{ resume_llm: string }> => {
            const url = numero != null
                ? `/documents/${documentId}/versions/${numero}/analyser`
                : `/documents/${documentId}/analyser`
            const res = await apiFetch(url, { method: 'POST' })
            if (!res.ok) throw new Error("Erreur lors de l'analyse")
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['document', documentId] })
            queryClient.invalidateQueries({ queryKey: ['versions', documentId] })
        },
    })
}
