export const ORGANISATION_PERMISSIONS = {
  CREATE_DORMITORY: "creer_dortoir",
  UPDATE_DORMITORY: "modifier_dortoir",
  DISABLE_DORMITORY: "desactiver_dortoir",
  MAINTAIN_DORMITORY: "mettre_dortoir_hors_service",
  CREATE_BED: "creer_lit",
  UPDATE_BED: "modifier_lit",
  MAINTAIN_BED: "mettre_lit_hors_service",
  ENABLE_BED: "reactiver_lit",
  VIEW_HOSTING: "consulter_hebergement",
  VIEW_CENTER_RULES: "consulter_regles_centre",
  CONFIGURE_CENTER_RULES: "configurer_regles_centre",
  UPDATE_CENTER_RULES: "modifier_regles_centre",
  GENERATE_STRUCTURES: "generer_sections_groupes",
  VALIDATE_CENTER_ORGANIZATION: "valider_organisation_interne",
  MARK_CENTER_READY: "marquer_centre_pret_publication",
} as const

export type OrganisationPermission = typeof ORGANISATION_PERMISSIONS[keyof typeof ORGANISATION_PERMISSIONS]
