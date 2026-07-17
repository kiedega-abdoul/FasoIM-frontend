export const AFFECTATION_PERMISSIONS = {
  CREATE_REGION: "creer_region",
  UPDATE_REGION: "modifier_region",
  DISABLE_REGION: "desactiver_region",
  VIEW_REGION: "consulter_region",
  LIST_REGIONS: "lister_regions",
  CREATE_CENTER: "creer_centre",
  UPDATE_CENTER: "modifier_centre",
  DISABLE_CENTER: "desactiver_centre",
  MAINTAIN_CENTER: "mettre_centre_maintenance",
  ENABLE_CENTER: "reactiver_centre",
  VIEW_CENTER: "consulter_centre",
  LIST_CENTERS: "lister_centres",
  CHECK_CENTER_CAPACITY: "verifier_capacite_centre",
  PROPOSE_REGIONAL_ASSIGNMENT: "proposer_affectation_regionale",
  ASSIGN_REGION: "affecter_region",
  VIEW_REGIONAL_ASSIGNMENTS: "consulter_affectations_regionales",
  UPDATE_REGIONAL_ASSIGNMENT: "modifier_affectation_regionale",
  VALIDATE_REGIONAL_ASSIGNMENT: "valider_affectation_regionale",
  CANCEL_REGIONAL_ASSIGNMENT: "annuler_affectation_regionale",
} as const

export type AffectationPermission = typeof AFFECTATION_PERMISSIONS[keyof typeof AFFECTATION_PERMISSIONS]
