export type VolunteerRequestStatus = "EN_ATTENTE" | "ACCEPTEE" | "REJETEE" | "ANNULEE"

export type VolunteerRequest = {
  id: number
  session: number
  session_nom: string
  session_code: string
  session_annee: number
  code_suivi: string
  nom: string
  prenoms: string
  nom_et_prenoms: string
  identite_affichable: string
  sexe: string
  date_naissance: string | null
  lieu_naissance: string
  nationalite: string
  numero_cnib: string
  telephone: string
  email: string
  contact_urgence: string
  nom_contact_urgence: string
  region_residence: string
  province_residence: string
  commune_residence: string
  adresse_residence: string
  niveau_etude: string
  profession: string
  motivation: string
  statut_demande: VolunteerRequestStatus
  statut_libelle: string
  date_soumission: string
  date_decision: string | null
  motif_decision: string
  acceptable: boolean
  blocages_acceptation: string[]
}

export type ListResponse<T> = T[] | { results: T[] }

export type BatchLaunchResponse = {
  task_id: string
  progression_identifiant: string
  total: number
}

export type BatchProgress = {
  statut?: string
  status?: string
  pourcentage?: number
  progression?: number
  message?: string
  erreur?: string
}
