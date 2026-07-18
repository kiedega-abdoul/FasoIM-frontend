export type ImmergeType = "BEPC" | "BAC" | "CONCOURS" | "SELECTIONNE" | "VOLONTAIRE"

export type ImmergeStatus =
  | "CREE"
  | "CODE_GENERE"
  | "AFFECTE_REGION"
  | "AFFECTE_CENTRE"
  | "EN_IMMERSION"
  | "LIBERE"
  | "ANNULE"

export type ImmergeSourceResume = {
  id: number
  identite_affichable: string
  telephone?: string
  email?: string
  reference?: string
}

export type Immerge = {
  id: number
  session: number
  type_immerge: ImmergeType
  origine_id: number
  code_fasoim: string
  qr_code: string
  statut: ImmergeStatus
  date_creation_code: string | null
  source_resume: ImmergeSourceResume | null
}

export type PaginatedResponse<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type ImmergeStats = {
  total: number
  codes_generes: number
  deja_affectes: number
  par_statut: Array<{ statut: ImmergeStatus; total: number }>
  par_type: Array<{ type_immerge: ImmergeType; total: number }>
}
