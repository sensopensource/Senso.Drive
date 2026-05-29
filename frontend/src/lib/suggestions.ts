import type { Suggestion, SuggestionType } from "../hooks/useSuggestions"

// Libellé de type + titre humain d'une suggestion, dérivés du payload.
// Partagé par la modale Slavy et le dashboard (« Les idées de Slavy »).

export const TYPE_LABEL: Record<SuggestionType, string> = {
  regroupement: "Regroupement",
  suppression:  "Suppression",
  tag:          "Tag",
}

export function buildTitle(s: Suggestion): string {
  const nb = s.payload.documents.length
  if (s.type === 'regroupement') {
    const nom = s.payload.categorie_cible_nom
    if (nom) return `Regrouper ${nb} document${nb > 1 ? 's' : ''} dans "${nom}"`
    return `Regrouper ${nb} document${nb > 1 ? 's' : ''}`
  }
  if (s.type === 'suppression') {
    const keeperId = s.payload.document_conserve_id
    const keeper = s.payload.documents.find(d => d.id === keeperId)
    const copies = s.payload.documents.filter(d => d.id !== keeperId)
    const garder = keeper ? ` (garder "${keeper.titre}")` : ''
    if (copies.length === 1) {
      return `Supprimer le doublon "${copies[0].titre}"${garder}`
    }
    return `Supprimer ${copies.length} doublons${garder}`
  }
  const tag = s.payload.tag_name ?? '—'
  return `Ajouter le tag "${tag}" à ${nb} document${nb > 1 ? 's' : ''}`
}
