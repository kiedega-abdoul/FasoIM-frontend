import { useAuthStore } from "@/stores/auth-store"

export function currentScopeParams() {
  const assignment = useAuthStore.getState().context?.affectation_courante
  if (!assignment) return {}

  const params: Record<string, string | number> = {}
  if (assignment.session?.id) {
    params.session_id = assignment.session.id
  }

  if (assignment.niveau_affectation === "region" && assignment.region_code) {
    return { ...params, region_code: assignment.region_code }
  }

  if (assignment.niveau_affectation === "centre" && assignment.centre_id) {
    return {
      ...params,
      region_code: assignment.region_code || undefined,
      centre_id: assignment.centre_id,
    }
  }

  return params
}

export function currentCenterId() {
  return useAuthStore.getState().context?.affectation_courante?.centre_id ?? null
}
