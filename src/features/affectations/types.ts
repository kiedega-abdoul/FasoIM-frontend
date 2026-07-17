export type ListResponse<T> = T[] | { results: T[] }

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
