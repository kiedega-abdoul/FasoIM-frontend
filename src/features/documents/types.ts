export type ListResponse<T> = T[] | PaginatedResponse<T>

export type PaginatedResponse<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type FinalResultStatistics = {
  total: number
  eligibles: number
  non_eligibles: number
  a_verifier: number
  publies: number
}

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
  taux_presence?: number | null
  evaluation_active?: boolean
  moyenne_sur_20?: number | null
  motifs?: string[]
}

export type OfficialPublication = {
  id: number
  type_publication: "INFORMATIONS_ARRIVEE" | "ATTESTATIONS"
  statut: "BROUILLON" | "SOUMISE_REGION" | "A_CORRIGER" | "VALIDEE_REGION" | "PRETE_DGAS" | "PUBLIEE" | "DEPUBLIEE" | "REMPLACEE" | "ANNULEE"
  statut_libelle: string
  session?: number
  session_nom?: string
  region?: number | null
  region_nom?: string | null
  centre?: number | null
  centre_nom?: string | null
  motif_correction?: string | null
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

export type RegionalCertificateStatistics = {
  session_id: number
  regions: Array<{
    region_id: number
    region_nom: string
    total_immerges: number
    eligibles: number
    non_eligibles: number
    a_verifier: number
    generees: number
    signees: number
    publiees: number
    bloquees: number
    taux_couverture: number
    centres: Array<{ centre_id: number; centre__nom: string; statut: string; resume?: Record<string, unknown> }>
  }>
}


export type PublicArrivalInformation = {
  publication: { reference: string; version: number; date_publication: string }
  immerge: { nom_complet: string; code_fasoim: string; type_immerge: string; qr_code?: string }
  session: { nom: string; code: string; annee: number; date_debut: string; date_fin: string; directives_generales?: string; consignes_generales?: string; documents_exiges?: string[] }
  affectation: { region: string; centre: string; code_centre: string; province?: string; ville?: string; adresse?: string; lieu_accueil?: string; heure_accueil?: string; horaires_generaux?: string; section?: string | null; groupe?: string | null }
  hebergement: { dortoir?: string | null; lit?: string | null } | null
  consignes_centre: Record<string, string>
  kits_a_apporter: Array<{ designation: string; description?: string; quantite: number; unite: string; obligatoire: boolean }>
}
