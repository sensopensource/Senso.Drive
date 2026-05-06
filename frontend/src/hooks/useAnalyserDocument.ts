import { useMutation, useQueryClient } from "@tanstack/react-query"

async function analyserDocument(documentId: number): Promise<{ resume_llm: string }> {
    const token = localStorage.getItem('token')
    const res = await fetch(`http://localhost:8000/documents/${documentId}/analyser`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
    })
    if (!res.ok) throw new Error("Erreur lors de l'analyse")
    return res.json()
}

export function useAnalyserDocument(documentId: number) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: () => analyserDocument(documentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['document', documentId] })
        },
    })
}
