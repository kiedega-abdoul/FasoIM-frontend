import { httpClient } from "@/api/http-client"
import { currentScopeParams } from "./scope"
import type { AssignmentProgress, AssignmentTask, Center, CenterPayload, ListResponse, Region, RegionPayload, RegionalAssignment, RegionalCapacityReport, CenterAssignment, CenterCapacityReport } from "./types"

const list = <T>(data: ListResponse<T>) => Array.isArray(data) ? data : data.results
const withScope = (params?: Record<string, string | number | undefined>) => ({
  ...currentScopeParams(),
  ...params,
})

export const affectationsApi = {
  async regions(params?: Record<string, string | number | undefined>) {
    return list((await httpClient.get<ListResponse<Region>>("/affectations/regions/", { params: withScope(params) })).data)
  },
  async region(id: number) {
    return (await httpClient.get<Region>(`/affectations/regions/${id}/`, { params: withScope() })).data
  },
  async createRegion(data: RegionPayload) {
    return (await httpClient.post<Region>("/affectations/regions/", data, { params: withScope() })).data
  },
  async updateRegion(id: number, data: Partial<RegionPayload>) {
    return (await httpClient.patch<Region>(`/affectations/regions/${id}/`, data, { params: withScope() })).data
  },
  async disableRegion(id: number) {
    return (await httpClient.post(`/affectations/regions/${id}/desactiver/`, undefined, { params: withScope() })).data
  },
  async centers(params?: Record<string, string | number | undefined>) {
    return list((await httpClient.get<ListResponse<Center>>("/affectations/centres/", { params: withScope(params) })).data)
  },
  async center(id: number) {
    return (await httpClient.get<Center>(`/affectations/centres/${id}/`, { params: withScope() })).data
  },
  async createCenter(data: CenterPayload) {
    return (await httpClient.post<Center>("/affectations/centres/", data, { params: withScope() })).data
  },
  async updateCenter(id: number, data: Partial<CenterPayload>) {
    return (await httpClient.patch<Center>(`/affectations/centres/${id}/`, data, { params: withScope() })).data
  },
  async disableCenter(id: number) {
    return (await httpClient.post(`/affectations/centres/${id}/desactiver/`, undefined, { params: withScope() })).data
  },
  async maintainCenter(id: number) {
    return (await httpClient.post(`/affectations/centres/${id}/mettre-en-maintenance/`, undefined, { params: withScope() })).data
  },
  async enableCenter(id: number) {
    return (await httpClient.post(`/affectations/centres/${id}/reactiver/`, undefined, { params: withScope() })).data
  },

  async centerCapacities(sessionId: number, regionId: number) {
    return (await httpClient.get<CenterCapacityReport>(
      "/affectations/affectations-centres/capacites/",
      { params: withScope({ session_id: sessionId, region_id: regionId }) },
    )).data
  },
  async centerAssignments(params?: Record<string, string | number | undefined>) {
    return list((await httpClient.get<ListResponse<CenterAssignment>>("/affectations/affectations-centres/", { params: withScope(params) })).data)
  },
  async createCenterAssignment(data: { immerge_id?: number; code_fasoim?: string; centre_id: number; motif?: string }) {
    return (await httpClient.post<CenterAssignment>("/affectations/affectations-centres/affecter-manuellement/", data, { params: withScope() })).data
  },
  async proposeCenterBatch(data: { session_id: number; region_id: number; nombre: number }) {
    return (await httpClient.post<AssignmentTask>("/affectations/affectations-centres/proposer-lot/", data, { params: withScope() })).data
  },
  async validateCenterBatch(data: { affectation_ids: number[]; motif?: string }) {
    return (await httpClient.post<AssignmentTask>("/affectations/affectations-centres/valider-lot/", data, { params: withScope() })).data
  },
  async rejectCenterBatch(data: { affectation_ids: number[]; motif: string }) {
    return (await httpClient.post<AssignmentTask>("/affectations/affectations-centres/rejeter-lot/", data, { params: withScope() })).data
  },
  async cancelCenterAssignment(id: number, motif: string) {
    return (await httpClient.post(`/affectations/affectations-centres/${id}/annuler/`, { motif }, { params: withScope() })).data
  },
  async centerProgress(taskId: string) {
    return (await httpClient.get<AssignmentProgress>(`/affectations/affectations-centres/progression/${taskId}/`, { params: withScope() })).data
  },
  async regionalCapacities(sessionId: number) {
    return (await httpClient.get<RegionalCapacityReport>(
      "/affectations/affectations-regionales/capacites/",
      { params: withScope({ session_id: sessionId }) },
    )).data
  },
  async regionalAssignments(params?: Record<string, string | number | undefined>) {
    return list((await httpClient.get<ListResponse<RegionalAssignment>>("/affectations/affectations-regionales/", { params: withScope(params) })).data)
  },
  async createRegionalAssignment(data: { immerge_id?: number; code_fasoim?: string; region_id: number; motif?: string }) {
    return (await httpClient.post<RegionalAssignment>("/affectations/affectations-regionales/affecter-manuellement/", data, { params: withScope() })).data
  },
  async proposeRegionalBatch(data: { session_id: number; nombre: number; forcer_reliquat?: boolean }) {
    return (await httpClient.post<AssignmentTask>("/affectations/affectations-regionales/proposer-lot/", data, { params: withScope() })).data
  },
  async validateRegionalBatch(data: { affectation_ids: number[]; motif?: string }) {
    return (await httpClient.post<AssignmentTask>("/affectations/affectations-regionales/valider-lot/", data, { params: withScope() })).data
  },
  async rejectRegionalBatch(data: { affectation_ids: number[]; motif: string }) {
    return (await httpClient.post<AssignmentTask>("/affectations/affectations-regionales/rejeter-lot/", data, { params: withScope() })).data
  },
  async cancelRegionalAssignment(id: number, motif: string) {
    return (await httpClient.post(`/affectations/affectations-regionales/${id}/annuler/`, { motif }, { params: withScope() })).data
  },
  async regionalProgress(taskId: string) {
    return (await httpClient.get<AssignmentProgress>(`/affectations/affectations-regionales/progression/${taskId}/`, { params: withScope() })).data
  },
}
