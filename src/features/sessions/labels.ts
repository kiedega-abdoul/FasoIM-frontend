export const SESSION_TYPE_LABELS: Record<string, string> = {
  examen: "Examen", concours: "Concours", selectionne: "Sélection officielle", volontaire: "Volontaires", mixte: "Mixte",
}
export const PUBLIC_LABELS: Record<string, string> = {
  BEPC: "BEPC", BAC: "BAC", CONCOURS: "Concours", SELECTIONNE: "Personnes sélectionnées", VOLONTAIRE: "Volontaires", MIXTE: "Mixte",
}
export const STATUS_LABELS: Record<string, string> = {
  brouillon: "Brouillon", ouverte: "Ouverte", en_preparation: "En préparation", en_cours: "En cours", terminee: "Terminée", archivee: "Archivée", annulee: "Annulée",
}
export const MODE_LABELS: Record<string, string> = { import: "Import officiel", inscription: "Inscription volontaire", mixte: "Import et inscription" }

export function formatDate(value?: string | null) {
  if (!value) return "—"
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(`${value.slice(0, 10)}T00:00:00`))
}
