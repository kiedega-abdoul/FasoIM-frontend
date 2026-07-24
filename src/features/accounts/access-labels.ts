const ACCESS_DOMAIN_LABELS: Record<string, string> = {
  accounts: "Comptes et accès",
  sessions_app: "Sessions d’immersion",
  imports_app: "Listes officielles",
  immerges: "Immergés et volontaires",
  affectations: "Affectations",
  organisation: "Organisation des centres",
  sante: "Suivi médical",
  kits: "Articles à apporter et à remettre",
  activites: "Activités et évaluations",
  repas: "Repas et ravitaillement",
  incidents: "Incidents",
  notifications: "Messages et rappels",
  documents: "Documents et attestations",
  audit: "Suivi et contrôle",
}

export function accessDomainLabel(value?: string | null) {
  return value ? (ACCESS_DOMAIN_LABELS[value] ?? "Autres accès") : "Autres accès"
}
