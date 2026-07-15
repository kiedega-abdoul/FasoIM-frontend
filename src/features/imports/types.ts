export type ImportSource = "BEPC" | "BAC" | "CONCOURS" | "SELECTIONNES" | "VOLONTAIRES_ACCEPTES"
export type ImportStatus = "RECU" | "LECTURE_COLONNES_EN_COURS" | "CORRESPONDANCE_REQUISE" | "CORRESPONDANCE_VALIDEE" | "VALIDATION_EN_COURS" | "VALIDE" | "VALIDE_AVEC_ERREURS" | "CONFIRMATION_EN_COURS" | "TERMINE" | "ECHEC" | "ANNULE"
export type RowStatus = "EN_ATTENTE" | "VALIDE" | "ERREUR" | "IGNOREE" | "IMPORTEE"
export type ListResponse<T> = T[] | { count: number; next: string | null; previous: string | null; results: T[] }
export type PaginatedResponse<T> = { count: number; next: string | null; previous: string | null; results: T[] }

export type ExpectedField = { code: string; libelle: string; obligatoire: boolean }
export type Mapping = { id: number; import_officiel: number; champ_cible: string; libelle_champ_cible: string; colonne_source: string; obligatoire: boolean; confirmee: boolean; ordre: number; transformation: Record<string, unknown> }
export type ImportActor = { id: number; nom_complet: string; email: string }
export type OfficialImport = {
  id: number; session: number; session_code: string; session_libelle: string
  type_source: ImportSource; type_source_libelle: string; type_fichier: "EXCEL" | "CSV"; type_fichier_libelle: string
  nom_fichier_original: string; taille_fichier: number; statut: ImportStatus; statut_libelle: string
  total_lignes: number; lignes_valides: number; lignes_erreur: number; lignes_ignorees: number; lignes_importees: number
  importe_par_nom: string; date_import: string; date_lecture_colonnes: string | null; date_correspondance: string | null; date_validation: string | null; date_confirmation: string | null; date_fin_traitement: string | null
  colonnes_detectees?: string[]; parametres_lecture?: { ligne_entete?: number; premiere_ligne_donnees?: number; [key: string]: unknown }
  message_erreur?: string; commentaire?: string; importe_par?: ImportActor | null; correspondance_confirmee_par?: ImportActor | null; confirme_par?: ImportActor | null
  correspondances?: Mapping[]; champs_attendus?: ExpectedField[]
}
export type ImportRow = { id: number; import_officiel: number; numero_ligne: number; donnees_brutes: Record<string, unknown>; donnees_normalisees: Record<string, unknown>; statut: RowStatus; statut_libelle: string; message_statut: string }
export type ImportError = { id: number; import_officiel: number; ligne_import: number; numero_ligne: number; champ_cible: string; colonne_source: string; type_erreur: string; type_erreur_libelle: string; gravite: "BLOQUANTE" | "AVERTISSEMENT"; gravite_libelle: string; message: string; valeur_recue: string; code_erreur: string }
export type Progress = { import_id: number; operation: string; pourcentage: number; message: string; updated_at: string }
