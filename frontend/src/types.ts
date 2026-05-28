
export type User = {
    id: number
    email: string
    nom: string
    role:  string
}

export type Token = {
    access_token: string
    token_type: string
}

export type LoginResponse = {
    access_token: string
    token_type: string
}

export type Categorie = {
    id: number
    nom: string
    id_parent: number | null
    count: number
}

// Forme de l'arbre construite cote front (a partir de la liste plate)
export type CategorieNode = Categorie & {
    children: CategorieNode[]
    depth: number
}

export type Tag = {
    id: number
    name: string
    color: string
    created_at: string
}

export type Document = {
    id: number
    titre: string
    auteur: string | null
    date_creation: string  // ISO string venant du back
    type_fichier: string | null  // "pdf" | "docx" | "txt" | "md" | null
    id_categorie: number | null
    tags: Tag[]
}

export type Version = {
    id: number
    numero: number
    type_fichier: string
    date_upload: string
    resume_llm: string | null
    apercu_contenu: string | null
}

// Pour GET /documents/{id} — inclut les champs supplementaires du detail
export type DocumentDetail = Document & {
    date_upload: string | null
    apercu_contenu: string | null
    resume_llm: string | null
    numero_version: number | null
}

// Pour GET /documents/search — Document + un extrait avec mot surligne en <b>
export type DocumentSearchResult = Document & {
    extrait: string | null
}

// Pour GET /documents/ — items + total pour la pagination
export type DocumentListResponse = {
    items: Document[]
    total: number
    page: number
    size: number
}

// ─── Admin dashboard (miroir de schemas/admin.py + schemas/log.py) ───

export type OverviewDocType = {
    type_fichier: string
    nb_documents: number
}

export type OverviewKpis = {
    utilisateurs_total: number
    utilisateurs_delta: number
    documents_total: number
    documents_delta: number
    tokens_periode: number
    tokens_delta_pct: number | null
    suggestions_total: number
    suggestions_validees: number
    suggestions_refusees: number
    suggestions_en_attente: number
    evenements_total: number
    evenements_erreurs_jour: number
    docs_par_type: OverviewDocType[]
}

export type TokensParSource = {
    source: string  // "resume" | "suggestion"
    tokens_in: number
    tokens_out: number
    cout_estime: number
}

export type TokensPoint = {
    jour: string  // date ISO
    tokens_in: number
    tokens_out: number
}

export type TokensStats = {
    total_tokens_in: number
    total_tokens_out: number
    cout_estime_total: number
    par_source: TokensParSource[]
    par_modele: { modele: string; tokens_in: number; tokens_out: number; cout_estime: number }[]
    serie_temporelle: TokensPoint[]
}

export type UtilisateurAdminRow = {
    id: number
    nom: string
    email: string
    role: string
    date_inscription: string
    nb_documents: number
    tokens_30j: number
    nb_suggestions: number
    dernier_login: string | null
}

export type LogRead = {
    id: number
    id_utilisateur: number | null
    niveau: string  // "info" | "ok" | "warn" | "err"
    action: string
    message: string
    contexte: Record<string, unknown> | null
    adresse_ip: string | null
    cree_le: string
}

export type LogListResponse = {
    items: LogRead[]
    total: number
    page: number
    size: number
}

export type StockageUtilisateur = {
    utilise_octets: number
    quota_octets: number
}