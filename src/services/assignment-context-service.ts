const STORAGE_KEY = "fasoim_current_assignment_id"
const SCOPE_STORAGE_KEY = "fasoim_current_assignment_scope"

export type PersistedAssignmentScope = {
  id: number
  est_permanente: boolean
  niveau_affectation: string
  session_id: number | null
  region_code: string
  centre_id: number | null
}

function parseScope(value: string | null): PersistedAssignmentScope | null {
  if (!value) return null

  try {
    const scope = JSON.parse(value) as Partial<PersistedAssignmentScope>
    if (!Number.isInteger(scope.id) || Number(scope.id) <= 0) return null

    return {
      id: Number(scope.id),
      est_permanente: Boolean(scope.est_permanente),
      niveau_affectation: String(scope.niveau_affectation ?? ""),
      session_id: Number.isInteger(scope.session_id) && Number(scope.session_id) > 0
        ? Number(scope.session_id)
        : null,
      region_code: String(scope.region_code ?? ""),
      centre_id: Number.isInteger(scope.centre_id) && Number(scope.centre_id) > 0
        ? Number(scope.centre_id)
        : null,
    }
  } catch {
    return null
  }
}

export const assignmentContextService = {
  getCurrentAssignmentId(): number | null {
    const value = window.localStorage.getItem(STORAGE_KEY)
    if (!value) return null

    const parsed = Number(value)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null
  },

  getCurrentAssignmentScope(): PersistedAssignmentScope | null {
    return parseScope(window.localStorage.getItem(SCOPE_STORAGE_KEY))
  },

  saveCurrentAssignmentId(assignmentId: number | null) {
    if (assignmentId === null) {
      window.localStorage.removeItem(STORAGE_KEY)
      return
    }

    window.localStorage.setItem(STORAGE_KEY, String(assignmentId))
  },

  saveCurrentAssignmentScope(scope: PersistedAssignmentScope | null) {
    if (!scope) {
      window.localStorage.removeItem(SCOPE_STORAGE_KEY)
      return
    }

    window.localStorage.setItem(SCOPE_STORAGE_KEY, JSON.stringify(scope))
  },

  clear() {
    window.localStorage.removeItem(STORAGE_KEY)
    window.localStorage.removeItem(SCOPE_STORAGE_KEY)
  },
}
