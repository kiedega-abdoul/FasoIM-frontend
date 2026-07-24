export type ListResponse<T> = T[] | { results: T[] }

export type PaginatedResponse<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type CenterAssignmentStats = {
  total: number
  hommes: number
  femmes: number
  a_organiser: number
  centre_nom: string
}

export type Region = {
  id: number
  code: string
  nom: string
  description?: string
  statut: string
  est_active?: boolean
}

export type Center = {
  id: number
  region: Region
  code: string
  nom: string
  province: string
  ville: string
  adresse?: string
  genre: string
  publics_acceptes?: string[]
  niveaux_acceptes?: string[]
  statut: string
  est_actif?: boolean
}

export type RegionPayload = {
  code?: string
  nom: string
  description: string
  statut?: string
}

export type CenterPayload = {
  region_id: number
  code?: string
  nom: string
  province: string
  ville: string
  adresse: string
  genre: string
  publics_acceptes: string[]
  niveaux_acceptes: string[]
  statut?: string
}


export type AssignmentActor = {
  id: number
  nom: string
}

export type AssignmentSession = {
  id: number
  code: string
  nom: string
  statut?: string
}

export type AssignmentImmerge = {
  id: number
  code_fasoim?: string
  type_immerge?: string
  statut?: string
}

export type RegionalAssignment = {
  id: number
  immerge: AssignmentImmerge
  session: AssignmentSession
  region: Region
  statut: "PROPOSEE" | "ACTIVE" | "REJETEE" | "ANNULEE" | "TRANSFEREE" | string
  affecte_par: AssignmentActor | null
  date_affectation: string
  motif: string
  est_proposee: boolean
  est_active: boolean
  est_ouverte: boolean
  profil_source?: {
    type_immerge?: string
    identite_affichable?: string
    sexe?: string
    region_reference?: string
    province_reference?: string
    niveau_examen?: string
    serie_filiere?: string
    structure_origine?: string
    niveau_etude?: string
    profession?: string
    identifiant_source?: string
  } | null
}

export type AssignmentTask = {
  task_id: string
  operation: string
  message: string
}

export type AssignmentProgress = {
  task_id: string
  operation: string
  statut: string
  progression: number
  message: string
  total: number
  traites: number
  proposes: number
  restants: number
  erreurs: number
  resultat?: {
    demandes: number
    candidats_pris: number
    propositions_creees: number
    candidats_restants: number
    sans_source: number[]
    sans_destination: number[]
    affectation_ids: number[]
    details: Record<string, unknown>
  } | null
}

export type RegionalCapacityCenter = {
  centre_id: number
  centre_code: string
  centre_nom: string
  province: string
  ville: string
  capacite_ouverte: number
}

export type RegionalCapacity = {
  region_id: number
  region_code: string
  region_nom: string
  nombre_centres: number
  capacite_ouverte: number
  propositions_en_attente: number
  affectations_validees: number
  places_reservees: number
  occupation: number
  disponible: number
  centres: RegionalCapacityCenter[]
}

export type RegionalCapacityReport = {
  session: {
    id: number
    code: string
    nom: string
    statut: string
    type_session: string
    public_cible: "BEPC" | "BAC" | "CONCOURS" | "SELECTIONNE" | "VOLONTAIRE" | "MIXTE" | string
  }
  capacite_totale: number
  propositions_en_attente_total: number
  affectations_validees_total: number
  places_reservees_total: number
  occupation_totale: number
  disponible_total: number
  candidats_disponibles: number
  maximum_proposable: number
  regions: RegionalCapacity[]
}


export type CenterAssignment = {
  id: number
  immerge: AssignmentImmerge
  session: AssignmentSession
  affectation_regionale_id: number
  centre: Center
  statut: "PROPOSEE" | "ACTIVE" | "REJETEE" | "ANNULEE" | "TRANSFEREE" | string
  affecte_par: AssignmentActor | null
  date_affectation: string
  motif: string
  est_proposee: boolean
  est_active: boolean
  est_ouverte: boolean
  profil_source?: RegionalAssignment["profil_source"]
  organisation_interne?: {
    section: { id: number; nom: string; code: string } | null
    groupe: { id: number; nom: string; code: string } | null
    dortoir: { id: number; nom: string } | null
    lit: { id: number; numero_lit: string } | null
  }
}

export type CenterCapacity = {
  centre_id: number
  centre_code: string
  centre_nom: string
  province: string
  ville: string
  genre: string
  publics_acceptes: string[]
  niveaux_acceptes: string[]
  capacite_ouverte: number
  propositions_en_attente: number
  affectations_validees: number
  places_reservees: number
  disponible: number
}

export type CenterCapacityReport = {
  session: RegionalCapacityReport["session"]
  region: Region
  nombre_centres: number
  capacite_totale: number
  propositions_en_attente_total: number
  affectations_validees_total: number
  places_reservees_total: number
  disponible_total: number
  candidats_disponibles: number
  maximum_proposable: number
  centres: CenterCapacity[]
}
