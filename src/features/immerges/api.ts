import { httpClient } from "@/api/http-client"
import { currentAssignmentSessionId } from "@/services/current-assignment-scope"
import type { Immerge, ImmergeStats, PaginatedResponse } from "./types"

function scopedParams(params?: Record<string, string | number | undefined>) {
  const sessionId = currentAssignmentSessionId()
  return {
    session_id: sessionId ?? undefined,
    ...params,
  }
}

export const immergesApi = {
  async list(params?: Record<string, string | number | undefined>) {
    const response = await httpClient.get<PaginatedResponse<Immerge>>("/immerges/immerges/", {
      params: scopedParams(params),
      timeout: 30000,
    })
    return response.data
  },

  async stats(params?: Record<string, string | number | undefined>) {
    const response = await httpClient.get<ImmergeStats>("/immerges/immerges/stats/", {
      params: scopedParams(params),
      timeout: 30000,
    })
    return response.data
  },
}
