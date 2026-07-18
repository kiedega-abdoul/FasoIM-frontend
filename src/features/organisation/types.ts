import type { Center } from "@/features/affectations/types"

export type ListResponse<T> = T[] | { results: T[] }

export type Dormitory = {
  id: number
  centre: Pick<Center, "id" | "code" | "nom">
  nom: string
  capacite: number
  sexe_dortoir: string
  statut: string
  created_at?: string
  updated_at?: string
}

export type Bed = {
  id: number
  dortoir: Dormitory
  numero_lit: string
  statut: string
  est_utilisable: boolean
  created_at?: string
  updated_at?: string
}

export type DormitoryPayload = {
  centre_id: number
  nom: string
  capacite: number
  sexe_dortoir: string
  statut?: string
}

export type BedPayload = {
  dortoir_id: number
  numero_lit: string
  statut?: string
}

export type OrganizationTaskResult = {
  demandes: number
  traites: number
  crees: number
  restants: number
  ids_crees?: number[]
  details?: Record<string, unknown>
}

export type CenterOrganizationRule = {
  id: number
  session: { id: number; code?: string; nom?: string }
  centre: Pick<Center, "id" | "code" | "nom">
  capacite_ouverte: number
  seuil_division_sections: number
  capacite_max_section: number
  seuil_division_groupes: number
  capacite_max_groupe: number
  repartition_sections_groupes_automatique: boolean
  attribution_lits_automatique: boolean
  lieu_accueil: string
  heure_accueil: string | null
  horaires_generaux: string
  consignes_accueil: string
  consignes_hebergement: string
  consignes_kits_a_apporter: string
  consignes_repas: string
  regles_discipline: string
  consignes_internes: string
  directives_locales: string
  statut: string
  date_validation?: string | null
  date_pret_publication?: string | null
  hebergement_active: boolean
  visite_medicale_active: boolean
  est_validee: boolean
  created_at?: string
  updated_at?: string
}

export type CenterOrganizationPayload = {
  session_id?: number
  centre_id?: number
  capacite_ouverte: number
  seuil_division_sections: number
  capacite_max_section: number
  seuil_division_groupes: number
  capacite_max_groupe: number
  repartition_sections_groupes_automatique: boolean
  attribution_lits_automatique: boolean
  lieu_accueil: string
  heure_accueil: string | null
  horaires_generaux: string
  consignes_accueil: string
  consignes_hebergement: string
  consignes_kits_a_apporter: string
  consignes_repas: string
  regles_discipline: string
  consignes_internes: string
  directives_locales: string
}

export type CenterOrganizationSummary = {
  total_affectations_centre: number
  sections: number
  groupes: number
  candidats_groupes: number
  affectations_groupes_actives: number
  propositions_groupes: number
  hebergement_active: boolean
  lits_utilisables: number
  candidats_lits: number
  attributions_lits_actives: number
  propositions_lits: number
  actions: {
    peut_generer_structures: boolean
    peut_valider_organisation: boolean
    peut_marquer_pret: boolean
  }
}


export type Section = {
  id: number
  session: { id: number; code?: string; nom?: string }
  centre: Pick<Center, "id" | "code" | "nom">
  nom: string
  code: string
  capacite_max: number
  statut: string
}

export type Group = {
  id: number
  section: Section
  nom: string
  code: string
  capacite_max: number
  statut: string
}

export type CenterAssignmentSummary = {
  id: number
  immerge_id: number
  session_id: number
  centre_id: number
  code_fasoim?: string | null
}

export type GroupAssignment = {
  id: number
  affectation_centre: CenterAssignmentSummary
  groupe: Group
  statut: string
  date_affectation?: string | null
  observations?: string
}

export type BedAssignment = {
  id: number
  affectation_centre: CenterAssignmentSummary
  lit: Bed
  statut: string
  date_attribution?: string | null
  date_liberation?: string | null
  observations?: string
}

export type OrganizationTaskLaunch = {
  task_id: string
  operation: string
  message: string
}

export type OrganizationProgress = {
  task_id: string
  operation?: string
  statut: string
  progression: number
  message?: string
  total: number
  traites: number
  crees: number
  restants: number
  erreurs: number
  resultat?: unknown
}
