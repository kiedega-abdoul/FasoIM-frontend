export type ListResponse<T> = T[] | { results: T[] }

export type KitSession = {
  id: number
  code: string
  nom: string
}

export type KitCenter = {
  id: number
  code: string
  nom: string
}

export type KitArticleType = "A_APPORTER" | "A_REMETTRE"
export type KitArticleStatus = "ACTIF" | "INACTIF"

export type KitArticle = {
  id: number
  session: KitSession
  centre: KitCenter | null
  designation: string
  description: string
  type_kit: KitArticleType
  type_kit_libelle: string
  statut_libelle: string
  quantite: number
  unite: string
  obligatoire: boolean
  ordre: number
  statut: KitArticleStatus
  portee: {
    type: "SESSION" | "CENTRE"
    centre_id: number | null
    centre_nom: string | null
  }
}

export type KitArticlePayload = {
  session_id: number
  centre_id?: number | null
  designation: string
  description?: string
  type_kit: KitArticleType
  quantite: number
  unite: string
  obligatoire: boolean
  ordre: number
  statut?: KitArticleStatus
}

export type KitRemiseStatus = "REMIS" | "PARTIEL" | "NON_REMIS" | "REMPLACE" | "DISPENSE"

export type KitRemise = {
  id: number
  affectation_centre: {
    id: number
    session: KitSession
    centre: KitCenter
    immerge: {
      id: number
      code_fasoim?: string
      type_immerge?: string
    }
    statut: string
  }
  article_kit: KitArticle
  quantite_prevue: number
  quantite_remise: number
  statut_remise: KitRemiseStatus
  statut_remise_libelle: string
  observations: string
  date_remise: string | null
  est_complete: boolean
}

export type KitStatsRow = {
  statut_remise: KitRemiseStatus
  total: number
}

export type KitTask = {
  task_id: string
  operation: string
  statut: string
  message: string
}
