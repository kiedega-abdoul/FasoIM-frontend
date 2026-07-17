import { httpClient } from "@/api/http-client"
import { currentScopeParams } from "@/features/affectations/scope"
import type { KitArticle, KitArticlePayload, KitRemise, KitStatsRow, KitTask, ListResponse } from "./types"

const list = <T>(data: ListResponse<T>) => Array.isArray(data) ? data : data.results
const withScope = (params?: Record<string, string | number | boolean | undefined | null>) => ({
  ...currentScopeParams(),
  ...params,
})

export const kitsApi = {
  async articles(params?: Record<string, string | number | boolean | undefined>) {
    return list((await httpClient.get<ListResponse<KitArticle>>("/kits/articles/", { params: withScope(params) })).data)
  },
  async article(id: number) {
    return (await httpClient.get<KitArticle>(`/kits/articles/${id}/`, { params: withScope() })).data
  },
  async createArticle(data: KitArticlePayload) {
    return (await httpClient.post<KitArticle>("/kits/articles/", data, { params: withScope() })).data
  },
  async updateArticle(id: number, data: Partial<KitArticlePayload>) {
    return (await httpClient.patch<KitArticle>(`/kits/articles/${id}/`, data, { params: withScope() })).data
  },
  async disableArticle(id: number) {
    return (await httpClient.post<KitArticle>(`/kits/articles/${id}/desactiver/`, {}, { params: withScope() })).data
  },
  async enableArticle(id: number) {
    return (await httpClient.post<KitArticle>(`/kits/articles/${id}/reactiver/`, {}, { params: withScope() })).data
  },
  async remises(params?: Record<string, string | number | undefined>) {
    return list((await httpClient.get<ListResponse<KitRemise>>("/kits/remises/", { params: withScope(params) })).data)
  },
  async prepareMass(data: { session_id: number; centre_id: number; article_kit_ids?: number[] }) {
    return (await httpClient.post<KitTask>("/kits/operations/preparer-masse/", data, { params: withScope() })).data
  },
  async recordRemise(data: { affectation_centre_id: number; article_kit_id: number; quantite_remise: number; observations?: string }) {
    return (await httpClient.post<KitRemise>("/kits/remises/", data, { params: withScope() })).data
  },
  async validateComplete(data: { affectation_centre_id: number; article_kit_ids?: number[] }) {
    return (await httpClient.post("/kits/remises/valider-complete/", data, { params: withScope() })).data
  },
  async dispenseRemise(id: number, observations = "") {
    return (await httpClient.post<KitRemise>(`/kits/remises/${id}/dispenser/`, { observations }, { params: withScope() })).data
  },
  async cancelRemise(id: number) {
    return (await httpClient.delete(`/kits/remises/${id}/`, { params: withScope() })).data
  },
  async stats(params?: Record<string, string | number | undefined>) {
    return list((await httpClient.get<ListResponse<KitStatsRow>>("/kits/remises/statistiques/", { params: withScope(params) })).data)
  },
}
