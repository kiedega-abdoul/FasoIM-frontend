export type AuthTokens = {
  access: string
  refresh: string
}

export type Acteur = {
  id: number
  username: string
  first_name: string
  last_name: string
  nom_complet: string
  email: string
  telephone: string | null
  titre: string
  organisation: string
  statut: string
}

export type RoleContexte = {
  id: number
  code: string
  libelle: string
  niveau: number
  perimetre_autorise: string
}

export type SessionContexte = {
  id: number
  code: string
  nom: string
  statut: string
  date_debut: string
  date_fin: string
}

export type AffectationContexte = {
  id: number
  est_permanente: boolean
  est_par_defaut: boolean
  niveau_affectation: string
  region_code: string
  region_nom: string
  centre_id: number | null
  centre_nom: string
  date_debut: string
  date_fin: string | null
  statut: string
  session: SessionContexte | null
  roles: RoleContexte[]
  permissions: string[]
}

export type ContexteActeur = {
  acteur: Acteur
  affectation_courante: AffectationContexte | null
  nombre_affectations_actives: number
  peut_changer_affectation: boolean
}

export type ListeAffectations = {
  affectation_par_defaut_id: number | null
  nombre_affectations_actives: number
  affectations: AffectationContexte[]
}
