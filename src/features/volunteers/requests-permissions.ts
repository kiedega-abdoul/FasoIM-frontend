export const VOLUNTEER_REQUEST_PERMISSIONS = {
  LIST: "lister_inscriptions_volontaires",
  VIEW: "consulter_inscription_volontaire",
  ACCEPT: "accepter_inscription_volontaire",
  REJECT: "refuser_inscription_volontaire",
  ACCEPT_BATCH: "accepter_inscriptions_volontaires_lot",
} as const

export const VOLUNTEER_REQUEST_ACCESS = Object.values(VOLUNTEER_REQUEST_PERMISSIONS)
