export type VolunteerApplicationPayload = {
  session_id: number
  nom: string
  prenoms: string
  sexe: "M" | "F" | "AUTRE"
  date_naissance: string
  lieu_naissance?: string
  nationalite?: string
  numero_cnib?: string
  telephone: string
  email?: string
  contact_urgence?: string
  nom_contact_urgence?: string
  region_residence?: string
  province_residence?: string
  commune_residence?: string
  adresse_residence?: string
  niveau_etude?: string
  profession?: string
  motivation: string
}

export type VolunteerApplicationCreated = {
  message: string
  code_suivi: string
  statut: "EN_ATTENTE"
}


export type VolunteerFollowUp = {
  code_suivi: string
  nom_complet: string
  session: string
  statut:
    | "EN_ATTENTE"
    | "EN_ETUDE"
    | "CORRECTION_DEMANDEE"
    | "CORRIGEE"
    | "ACCEPTEE"
    | "REJETEE"
    | "ANNULEE"
  statut_libelle: string
  date_soumission: string
  date_decision: string | null
  motif_decision: string
  code_fasoim: string
  message: string
}
