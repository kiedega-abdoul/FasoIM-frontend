export type PageResponse<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type ListResponse<T> = T[] | PageResponse<T>

export type ModuleActivite = {
  id: number
  code: string
  titre: string
  description: string
  categorie: string
  categorie_libelle?: string
  duree_prevue: number | null
  statut: string
  statut_libelle?: string
}

export type ActorResume = {
  id: number
  username?: string
  email?: string
  first_name?: string
  last_name?: string
  nom_complet?: string
}

export type Seance = {
  id: number
  module_activite: ModuleActivite | null
  type_seance?: string
  type_seance_libelle?: string
  session: { id: number; code: string; nom: string }
  centre: { id: number; code: string; nom: string }
  section?: { id: number; code: string; nom: string } | null
  groupe?: { id: number; code: string; nom: string } | null
  formateur: ActorResume | null
  titre: string
  date_seance: string
  heure_debut: string
  heure_fin: string
  lieu: string
  statut: string
  statut_libelle?: string
  observations?: string
  niveau_cible?: string
  statut_feuille_presence?: string
  statut_feuille_presence_libelle?: string
  date_ouverture_presence?: string | null
  date_validation_presence?: string | null
  date_cloture_presence?: string | null
  date_debut_reelle?: string | null
  date_fin_reelle?: string | null
  feuille_presence_modifiable?: boolean
}

export type Evaluation = {
  id: number
  session: { id: number; code: string; nom: string }
  centre: { id: number; code: string; nom: string }
  seance: { id: number; titre: string; date_seance: string; statut?: string } | null
  titre: string
  type_evaluation: string
  type_evaluation_libelle?: string
  bareme: string | number
  coefficient: string | number
  statut: string
  statut_libelle?: string
}

export type Presence = {
  id: number
  seance: { id: number; titre: string; date_seance: string }
  affectation_centre: {
    id: number
    immerge: { id: number; code_fasoim: string; type_immerge?: string | null }
  }
  statut_presence: string
  statut_presence_libelle?: string
  heure_arrivee: string | null
  observations: string
}

export type Note = {
  id: number
  evaluation: { id: number; titre: string; bareme: string | number; statut: string }
  affectation_centre: {
    id: number
    immerge: { id: number; code_fasoim: string; type_immerge?: string | null }
  }
  valeur: string | number | null
  appreciation: string
  statut_note: string
  statut_note_libelle?: string
  observations: string
}

export type TaskLaunch = {
  task_id: string
  operation: string
  statut: string
  message: string
}

export type TaskProgress = {
  task_id: string
  operation: string
  statut: "EN_ATTENTE" | "EN_COURS" | "TERMINEE" | "ECHEC" | "REFUSEE"
  progression: number
  message: string
  total: number
  traites: number
  erreurs: number
}
