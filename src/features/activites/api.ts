import { httpClient } from "@/api/http-client"
import { currentScopeParams } from "@/features/affectations/scope"
import type { Evaluation, ListResponse, ModuleActivite, Seance } from "./types"

const list = <T>(data: ListResponse<T>) => Array.isArray(data) ? data : data.results
const withScope = (params?: Record<string, string | number | boolean | undefined | null>) => ({
  ...currentScopeParams(),
  ...params,
})

export const activitesApi = {
  async modules(params?: Record<string, string | number | boolean | undefined>) {
    return list((await httpClient.get<ListResponse<ModuleActivite>>("/activites/activites/", { params: withScope(params) })).data)
  },
  async createModule(data: Record<string, unknown>) {
    return (await httpClient.post<ModuleActivite>("/activites/activites/", data, { params: withScope() })).data
  },
  async seances(params?: Record<string, string | number | boolean | undefined>) {
    return list((await httpClient.get<ListResponse<Seance>>("/activites/seances/", { params: withScope(params) })).data)
  },
  async createSeance(data: Record<string, unknown>) {
    return (await httpClient.post<Seance>("/activites/seances/", data, { params: withScope() })).data
  },
  async evaluations(params?: Record<string, string | number | boolean | undefined>) {
    return list((await httpClient.get<ListResponse<Evaluation>>("/activites/evaluations/", { params: withScope(params) })).data)
  },
  async createEvaluation(data: Record<string, unknown>) {
    return (await httpClient.post<Evaluation>("/activites/evaluations/", data, { params: withScope() })).data
  },
  async programEvaluation(data: Record<string, unknown>) {
    return (await httpClient.post<Evaluation>("/activites/evaluations/programmer/", data, { params: withScope() })).data
  },
}
