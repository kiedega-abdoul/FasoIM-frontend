import type { AffectationContexte } from "@/types/auth"

export type WorkspaceCode =
  | "ADMINISTRATION"
  | "DGAS"
  | "DIRECTION_REGIONALE"
  | "RESPONSABLE_CENTRE"
  | "AGENT_SANTE"
  | "FORMATEUR"
  | "ALIMENTATION"
  | "GENERIC"

const ROLE_TO_WORKSPACE: Record<string, WorkspaceCode> = {
  ADMINISTRATEUR: "ADMINISTRATION",
  DGAS: "DGAS",
  DIRECTEUR_REGIONAL: "DIRECTION_REGIONALE",
  RESPONSABLE_CENTRE: "RESPONSABLE_CENTRE",
  AGENT_SANTE: "AGENT_SANTE",
  FORMATEUR: "FORMATEUR",
  GESTIONNAIRE_ALIMENTATION: "ALIMENTATION",
}

export function resolveWorkspace(assignment: AffectationContexte | null | undefined): WorkspaceCode {
  if (!assignment) {
    return "GENERIC"
  }

  for (const role of assignment.roles) {
    const workspace = ROLE_TO_WORKSPACE[role.code]
    if (workspace) {
      return workspace
    }
  }

  return "GENERIC"
}
