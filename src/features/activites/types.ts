export type ListResponse<T> = T[] | { results: T[] }

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

export type Seance = {
  id: number
  module_activite: ModuleActivite | null
  type_seance?: string
  type_seance_libelle?: string
  session: { id: number; code: string; nom: string }
  centre: { id: number; code: string; nom: string }
  formateur: { id: number; nom_complet: string; username?: string } | null
  titre: string
  date_seance: string
  heure_debut: string
  heure_fin: string
  lieu: string
  statut: string
  statut_libelle?: string
}

export type Evaluation = {
  id: number
  session: { id: number; code: string; nom: string }
  centre: { id: number; code: string; nom: string }
  seance: { id: number; titre: string; date_seance: string } | null
  titre: string
  type_evaluation: string
  type_evaluation_libelle?: string
  bareme: string | number
  coefficient: string | number
  statut: string
  statut_libelle?: string
}
