import type { Document, Categorie } from "../../types"

// Actions de l'explorateur, fournies par la page et passées aux lignes/cartes.
export type DocActions = {
  rename: (id: number, titre: string) => void
  remove: (id: number) => void
  download: (doc: Document) => void
}

export type FolderActions = {
  rename: (id: number, nom: string) => void
  togglePrivee: (cat: Categorie) => void
  remove: (id: number) => void
}
