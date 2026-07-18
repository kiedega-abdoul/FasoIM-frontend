export type ListResponse<T> = T[] | { results: T[] }

export type FinalResult = {
  id: number
  session: number
  centre: number
  immerge: number
  code_fasoim: string
  decision: "A_VERIFIER" | "ELIGIBLE" | "NON_ELIGIBLE"
  decision_libelle: string
  statut: "CALCULE" | "VALIDE_CENTRE" | "SOUMIS_REGION" | "VALIDE_REGION" | "PUBLIE" | "ANNULE"
  statut_libelle: string
  date_calcul?: string | null
  date_validation_centre?: string | null
}

export type OfficialPublication = {
  id: number
  type_publication: "INFORMATIONS_ARRIVEE" | "ATTESTATIONS"
  statut: "BROUILLON" | "SOUMISE_REGION" | "A_CORRIGER" | "VALIDEE_REGION" | "PRETE_DGAS" | "PUBLIEE" | "DEPUBLIEE" | "REMPLACEE" | "ANNULEE"
  statut_libelle: string
  date_soumission?: string | null
  resume?: {
    hebergement?: {
      lits_liberes?: number
    }
    [key: string]: unknown
  } | null
}

export type GeneratedDocument = {
  id: number
  type_document: string
  statut: string
  resultat_final?: number | null
}

export type TaskLaunch = { task_id: string; statut: string }
export type TaskProgress = {
  statut: "EN_ATTENTE" | "EN_COURS" | "TERMINE" | "ECHEC" | string
  progression?: number
  erreur?: string
  resultat?: Record<string, unknown>
}
