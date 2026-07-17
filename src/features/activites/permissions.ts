export const ACTIVITES_PERMISSIONS = {
  VIEW_ACTIVITIES: "consulter_activites",
  CREATE_ACTIVITY: "creer_activite",
  UPDATE_ACTIVITY: "modifier_activite",
  VIEW_SEANCES: "consulter_seances",
  PLAN_SEANCE: "planifier_seance",
  UPDATE_SEANCE: "modifier_seance",
  VIEW_EVALUATIONS: "consulter_evaluations",
  CREATE_EVALUATION: "creer_evaluation",
  UPDATE_EVALUATION: "modifier_evaluation",
} as const

export const ACTIVITES_ACCESS = [
  ACTIVITES_PERMISSIONS.VIEW_ACTIVITIES,
  ACTIVITES_PERMISSIONS.VIEW_SEANCES,
  ACTIVITES_PERMISSIONS.VIEW_EVALUATIONS,
] as const
