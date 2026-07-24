export const ACTIVITES_PERMISSIONS = {
  VIEW_ACTIVITIES: "consulter_activites",
  CREATE_ACTIVITY: "creer_activite",
  UPDATE_ACTIVITY: "modifier_activite",
  VIEW_SEANCES: "consulter_seances",
  PLAN_SEANCE: "planifier_seance",
  UPDATE_SEANCE: "modifier_seance",
  START_SEANCE: "demarrer_seance",
  END_SEANCE: "terminer_seance",
  VIEW_PRESENCES: "consulter_presences",
  OPEN_ATTENDANCE: "ouvrir_feuille_presence",
  ENTER_ATTENDANCE: "saisir_presence",
  VALIDATE_ATTENDANCE: "valider_presence",
  CLOSE_ATTENDANCE: "cloturer_feuille_presence",
  VIEW_NOTES: "consulter_notes",
  ENTER_NOTE: "saisir_note",
  OPEN_GRADES: "ouvrir_saisie_notes",
  CLOSE_EVALUATION: "cloturer_evaluation",
  VIEW_EVALUATIONS: "consulter_evaluations",
  CREATE_EVALUATION: "creer_evaluation",
  UPDATE_EVALUATION: "modifier_evaluation",
} as const

export const ACTIVITES_ACCESS = [
  ACTIVITES_PERMISSIONS.VIEW_ACTIVITIES,
  ACTIVITES_PERMISSIONS.VIEW_SEANCES,
  ACTIVITES_PERMISSIONS.VIEW_EVALUATIONS,
] as const
