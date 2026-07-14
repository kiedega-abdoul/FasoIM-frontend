const STORAGE_KEY = "fasoim_current_assignment_id"

export const assignmentContextService = {
  getCurrentAssignmentId(): number | null {
    const value = window.localStorage.getItem(STORAGE_KEY)
    if (!value) {
      return null
    }

    const parsed = Number(value)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null
  },

  saveCurrentAssignmentId(assignmentId: number | null) {
    if (assignmentId === null) {
      window.localStorage.removeItem(STORAGE_KEY)
      return
    }

    window.localStorage.setItem(STORAGE_KEY, String(assignmentId))
  },

  clear() {
    window.localStorage.removeItem(STORAGE_KEY)
  },
}
