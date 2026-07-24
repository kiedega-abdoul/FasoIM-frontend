export type Actor = {
  id: number; username: string; first_name: string; last_name: string; nom_complet: string;
  email: string; telephone: string | null; titre: string; organisation: string;
  signature_image: string | null; cachet_image: string | null; statut: string
}
export type Role = { id:number; code:string; libelle:string; description:string; niveau:number; perimetre_autorise:string; est_systeme:boolean; est_modifiable:boolean; statut:string }
export type Permission = { id:number; code:string; libelle:string; module:string; description:string; est_systeme:boolean; statut:string }
export type ActorSummary = Pick<Actor,'id'|'username'|'nom_complet'|'email'|'telephone'|'statut'>
export type ActorAssignment = { id:number; acteur_id:number; acteur:ActorSummary; session_id:number|null; session_code:string; session_nom:string; niveau_affectation:string; region_code:string; region_nom?:string; centre_id:number|null; centre_nom?:string; date_debut:string; date_fin:string|null; statut:string; est_active:boolean; role_codes:string[] }
export type RoleAssignment = { id:number; affectation_acteur_id:number; role_id:number; role:Role; date_attribution:string; date_expiration:string|null; statut:string; est_actif:boolean }
export type RolePermission = { id:number; role_id:number; role_code:string; permission_id:number; permission_code:string; permission_libelle:string; est_delegable:boolean; perimetre_delegation_max:string; statut:string }
export type DirectPermission = { id:number; affectation_acteur_id:number; permission_id:number; permission:Permission; date_attribution:string; date_expiration:string|null; est_delegable:boolean; motif:string; statut:string; est_active:boolean }
export type PermissionRequest = { id:number; acteur_id:number; acteur:ActorSummary; affectation_acteur_id:number|null; permission_id:number; permission:Permission; justification:string; statut:string; date_demande:string; date_decision:string|null; decideur:ActorSummary|null; motif_decision:string }
export type Delegation = { id:number; acteur_source_id:number; acteur_source:ActorSummary; acteur_cible_id:number; acteur_cible:ActorSummary; affectation_acteur_id:number; role_id:number|null; role:Role|null; permission_id:number|null; permission:Permission|null; type_delegation:string; date_debut:string; date_fin:string; motif:string; statut:string; est_active:boolean }
export type ListResponse<T> = T[] | {results:T[]}


export type AssignmentSessionReference = {
  id: number
  code: string
  nom: string
  statut: string
  date_debut: string
  date_fin: string
}

export type AssignmentRegionReference = {
  id: number
  code: string
  nom: string
}

export type AssignmentCentreReference = {
  id: number
  code: string
  nom: string
  ville: string
  province: string
  region_code: string
  region_nom: string
}

export type AssignmentReferences = {
  sessions: AssignmentSessionReference[]
  regions: AssignmentRegionReference[]
  centres: AssignmentCentreReference[]
}
