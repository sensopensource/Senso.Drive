import { apiFetch } from "../api"

// Télécharge la dernière version d'un document (fetch authentifié → blob → lien).
export async function telechargerDocument(id: number, nomFichier: string) {
  const response = await apiFetch(`/documents/${id}/download`)
  if (!response.ok) return
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomFichier
  a.click()
  URL.revokeObjectURL(url)
}
