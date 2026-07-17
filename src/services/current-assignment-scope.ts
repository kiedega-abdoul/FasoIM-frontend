import { useAuthStore } from "@/stores/auth-store"

export function currentAssignmentSessionId() {
  return useAuthStore.getState().context?.affectation_courante?.session?.id ?? null
}

export function currentAssignmentSessionParams() {
  const sessionId = currentAssignmentSessionId()
  return sessionId ? { session_id: sessionId } : {}
}
