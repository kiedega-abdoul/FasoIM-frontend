import type { PublicCible } from "@/features/sessions/types"
import type { ImportSource } from "./types"

const SOURCE_BY_PUBLIC: Record<PublicCible, ImportSource[]> = {
  BEPC: ["BEPC"],
  BAC: ["BAC"],
  CONCOURS: ["CONCOURS"],
  SELECTIONNE: ["SELECTIONNES"],
  VOLONTAIRE: ["VOLONTAIRES_ACCEPTES"],
  MIXTE: ["BEPC", "BAC", "CONCOURS", "SELECTIONNES", "VOLONTAIRES_ACCEPTES"],
}

export function compatibleImportSources(publicCible?: PublicCible | null): ImportSource[] {
  if (!publicCible) return []
  return SOURCE_BY_PUBLIC[publicCible] ?? []
}
