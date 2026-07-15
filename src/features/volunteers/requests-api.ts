import { httpClient } from "@/api/http-client"
import type { BatchLaunchResponse, BatchProgress, ListResponse, VolunteerRequest } from "./requests-types"

const list = <T>(data: ListResponse<T>) => Array.isArray(data) ? data : data.results

export const volunteerRequestsApi = {
  async list(params?: Record<string, string | number | undefined>) {
    const response = await httpClient.get<ListResponse<VolunteerRequest>>("/immerges/volontaires/", { params })
    return list(response.data)
  },

  async detail(id: number) {
    return (await httpClient.get<VolunteerRequest>(`/immerges/volontaires/${id}/`)).data
  },

  async accept(id: number) {
    return (await httpClient.post<VolunteerRequest>(`/immerges/volontaires/${id}/accepter/`, {
      creer_immerge: true,
    })).data
  },

  async reject(id: number, motif_decision: string) {
    return (await httpClient.post<VolunteerRequest>(`/immerges/volontaires/${id}/rejeter/`, {
      motif_decision,
    })).data
  },

  async acceptBatch(
    inscriptionIds: number[],
    sessionId: number,
  ): Promise<BatchLaunchResponse> {
    const response = await httpClient.post<BatchLaunchResponse>(
      "/immerges/volontaires/accepter-lot-async/",
      {
        inscription_ids: inscriptionIds,
        session_id: sessionId,
      },
    )

    return response.data
  },

    async batchProgress(
    identifiant: string,
    sessionId: number,
  ): Promise<BatchProgress> {
    const response = await httpClient.get<BatchProgress>(
      "/immerges/volontaires/progression-acceptation-lot/",
      {
        params: {
          identifiant,
          session_id: sessionId,
        },
      },
    )

    return response.data
  }
}
