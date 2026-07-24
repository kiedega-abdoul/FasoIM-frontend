export type SessionStatus = "brouillon" | "ouverte" | "en_preparation" | "en_cours" | "terminee" | "archivee" | "annulee"
export type SessionType = "examen" | "concours" | "selectionne" | "volontaire" | "mixte"
export type PublicCible = "BEPC" | "BAC" | "CONCOURS" | "SELECTIONNE" | "VOLONTAIRE" | "MIXTE"
export type ModeEntree = "import" | "inscription" | "mixte"

export type SessionCenterSelection = {
  centre_id: number
  centre_code: string
  centre_nom: string
}

export type SessionParameters = {
  id: number
  session: number
  mode_entree: ModeEntree
  hebergement_active: boolean
  repas_active: boolean
  visite_medicale_active: boolean
  mode_visite_medicale: "arrivee"
  activites_active: boolean
  evaluation_active: boolean
  attestation_active: boolean
  consultation_publique_active: boolean
  taux_presence_minimum_attestation: number
  moyenne_minimum_attestation: number
  directives_generales: string
  consignes_generales: string
  documents_exiges: string[]
  centres_accueil: SessionCenterSelection[]
  utilise_import?: boolean
  utilise_inscription_volontaire?: boolean
}

export type ImmersionSession = {
  id: number
  nom: string
  code: string
  annee: number
  numero_promotion: number
  type_session: SessionType
  public_cible: PublicCible
  date_debut: string
  date_fin: string
  date_ouverture_inscription: string | null
  date_fermeture_inscription: string | null
  statut: SessionStatus
  description: string
  motif_annulation: string
  date_annulation: string | null
  parametres: SessionParameters | null
  est_active: boolean
  est_modifiable: boolean
  accepte_import: boolean
  accepte_inscription_volontaire: boolean
}

export type SessionPayload = {
  nom: string
  annee: number
  type_session: SessionType
  public_cible: PublicCible
  date_debut: string
  date_fin: string
  date_ouverture_inscription: string | null
  date_fermeture_inscription: string | null
  description: string
}

export type SessionParametersPayload = Omit<SessionParameters, "id" | "session" | "utilise_import" | "utilise_inscription_volontaire">

export type PublicSession = Pick<ImmersionSession, "id" | "nom" | "code" | "type_session" | "date_debut" | "date_fin" | "date_ouverture_inscription" | "date_fermeture_inscription" | "description"> & {
  type_session_libelle: string
  directives_generales: string
  documents_exiges: string[]
}

export type ListResponse<T> = T[] | { results: T[] }


export type ArrivalConsultationSession = {
  id: number
  nom: string
  code: string
  type_session: SessionType
  type_session_libelle: string
  public_cible: PublicCible
  public_cible_libelle: string
  annee: number
  date_debut: string
  date_fin: string
}
