export const KITS_PERMISSIONS = {
  VIEW_ARTICLES: "consulter_articles_kit",
  CREATE_BRING_ARTICLE: "creer_article_kit_a_apporter",
  CREATE_GIVE_ARTICLE: "creer_article_kit_a_remettre",
  UPDATE_ARTICLE: "modifier_article_kit",
  DISABLE_ARTICLE: "desactiver_article_kit",
  ENABLE_ARTICLE: "reactiver_article_kit",
  DELETE_ARTICLE: "supprimer_article_kit",
  VIEW_REMISES: "consulter_remises_kit",
  RECORD_REMISE: "enregistrer_remise_kit",
  CANCEL_REMISE: "annuler_remise_kit",
  VIEW_STATS: "consulter_statistiques_kits",
  PREPARE_MASS: "preparer_remises_kit_masse",
  VALIDATE_MASS: "valider_remises_kit_masse",
  CANCEL_MASS: "annuler_remises_kit_masse",
  VIEW_PROGRESS: "consulter_progression_kits",
} as const

export type KitsPermission = typeof KITS_PERMISSIONS[keyof typeof KITS_PERMISSIONS]
