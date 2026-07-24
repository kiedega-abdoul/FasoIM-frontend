import { httpClient } from "@/api/http-client"
import { currentScopeParams } from "@/features/affectations/scope"
import type { Bed, BedAssignment, BedPayload, CenterOrganizationPayload, CenterOrganizationRule, CenterOrganizationSummary, Dormitory, DormitoryPayload, Group, GroupAssignment, ListResponse, OrganizationProgress, OrganizationTaskLaunch, OrganizationTaskResult, Section } from "./types"

const list = <T>(data: ListResponse<T>) => Array.isArray(data) ? data : data.results
const withScope = (params?: Record<string, string | number | undefined>) => ({
  ...currentScopeParams(),
  ...params,
})

export const organisationApi = {

  async sections(params?: Record<string, string | number | undefined>) {
    return list((await httpClient.get<ListResponse<Section>>("/organisation/sections/", { params: withScope(params) })).data)
  },
  async groups(params?: Record<string, string | number | undefined>) {
    return list((await httpClient.get<ListResponse<Group>>("/organisation/groupes/", { params: withScope(params) })).data)
  },
  async groupAssignments(params?: Record<string, string | number | undefined>) {
    return list((await httpClient.get<ListResponse<GroupAssignment>>("/organisation/affectations-groupes/", { params: withScope(params) })).data)
  },
  async proposeGroupAssignments(sessionId: number, centerId: number, nombre: number) {
    return (await httpClient.post<OrganizationTaskLaunch>("/organisation/affectations-groupes/proposer-lot/", { session_id: sessionId, centre_id: centerId, nombre }, { params: withScope() })).data
  },
  async validateGroupAssignments(ids: number[]) {
    return (await httpClient.post<OrganizationTaskLaunch>("/organisation/affectations-groupes/valider-lot/", { ids }, { params: withScope() })).data
  },
  async rejectGroupAssignments(ids: number[]) {
    return (await httpClient.post<OrganizationTaskLaunch>("/organisation/affectations-groupes/rejeter-lot/", { ids }, { params: withScope() })).data
  },
  async groupAssignmentProgress(taskId: string) {
    return (await httpClient.get<OrganizationProgress>(`/organisation/affectations-groupes/progression/${taskId}/`, { params: withScope() })).data
  },
  async bedAssignments(params?: Record<string, string | number | undefined>) {
    return list((await httpClient.get<ListResponse<BedAssignment>>("/organisation/attributions-lits/", { params: withScope(params) })).data)
  },
  async proposeBedAssignments(sessionId: number, centerId: number, nombre: number) {
    return (await httpClient.post<OrganizationTaskLaunch>("/organisation/attributions-lits/proposer-lot/", { session_id: sessionId, centre_id: centerId, nombre }, { params: withScope() })).data
  },
  async validateBedAssignments(ids: number[]) {
    return (await httpClient.post<OrganizationTaskLaunch>("/organisation/attributions-lits/valider-lot/", { ids }, { params: withScope() })).data
  },
  async rejectBedAssignments(ids: number[]) {
    return (await httpClient.post<OrganizationTaskLaunch>("/organisation/attributions-lits/rejeter-lot/", { ids }, { params: withScope() })).data
  },
  async bedAssignmentProgress(taskId: string) {
    return (await httpClient.get<OrganizationProgress>(`/organisation/attributions-lits/progression/${taskId}/`, { params: withScope() })).data
  },
  async dormitories(params?: Record<string, string | number | undefined>) {
    return list((await httpClient.get<ListResponse<Dormitory>>("/organisation/dortoirs/", { params: withScope(params) })).data)
  },
  async dormitory(id: number) {
    return (await httpClient.get<Dormitory>(`/organisation/dortoirs/${id}/`, { params: withScope() })).data
  },
  async createDormitory(data: DormitoryPayload) {
    return (await httpClient.post<Dormitory>("/organisation/dortoirs/", data, { params: withScope() })).data
  },
  async updateDormitory(id: number, data: Partial<DormitoryPayload>) {
    return (await httpClient.patch<Dormitory>(`/organisation/dortoirs/${id}/`, data, { params: withScope() })).data
  },
  async disableDormitory(id: number) {
    return (await httpClient.delete(`/organisation/dortoirs/${id}/`, { params: withScope() })).data
  },
  async maintainDormitory(id: number) {
    return (await httpClient.post<Dormitory>(`/organisation/dortoirs/${id}/mettre-hors-service/`, undefined, { params: withScope() })).data
  },
  async enableDormitory(id: number) {
    return (await httpClient.post<Dormitory>(`/organisation/dortoirs/${id}/reactiver/`, undefined, { params: withScope() })).data
  },
  async generateDormitoryBeds(id: number) {
    return (await httpClient.post<OrganizationTaskResult>(`/organisation/dortoirs/${id}/generer-lits/`, {}, { params: withScope() })).data
  },
  async beds(params?: Record<string, string | number | undefined>) {
    return list((await httpClient.get<ListResponse<Bed>>("/organisation/lits/", { params: withScope(params) })).data)
  },
  async bed(id: number) {
    return (await httpClient.get<Bed>(`/organisation/lits/${id}/`, { params: withScope() })).data
  },
  async createBed(data: BedPayload) {
    return (await httpClient.post<Bed>("/organisation/lits/", data, { params: withScope() })).data
  },
  async updateBed(id: number, data: Partial<BedPayload>) {
    return (await httpClient.patch<Bed>(`/organisation/lits/${id}/`, data, { params: withScope() })).data
  },
  async disableBed(id: number) {
    return (await httpClient.delete(`/organisation/lits/${id}/`, { params: withScope() })).data
  },
  async maintainBed(id: number) {
    return (await httpClient.post<Bed>(`/organisation/lits/${id}/mettre-hors-service/`, undefined, { params: withScope() })).data
  },
  async enableBed(id: number) {
    return (await httpClient.post<Bed>(`/organisation/lits/${id}/reactiver/`, undefined, { params: withScope() })).data
  },
  async centerRules(params?: Record<string, string | number | undefined>) {
    return list((await httpClient.get<ListResponse<CenterOrganizationRule>>("/organisation/regles-centres/", { params: withScope(params) })).data)
  },
  async createCenterRule(data: CenterOrganizationPayload) {
    return (await httpClient.post<CenterOrganizationRule>("/organisation/regles-centres/", data, { params: withScope() })).data
  },
  async updateCenterRule(id: number, data: Partial<CenterOrganizationPayload>) {
    return (await httpClient.patch<CenterOrganizationRule>(`/organisation/regles-centres/${id}/`, data, { params: withScope() })).data
  },
  async centerRuleSummary(id: number) {
    return (await httpClient.get<CenterOrganizationSummary>(`/organisation/regles-centres/${id}/synthese/`, { params: withScope() })).data
  },
  async centerRuleProgress(taskId: string) {
    return (await httpClient.get<OrganizationProgress>(`/organisation/regles-centres/progression/${taskId}/`, { params: withScope() })).data
  },
  async generateCenterStructures(id: number) {
    return (await httpClient.post(`/organisation/regles-centres/${id}/generer-structures/`, {}, { params: withScope() })).data
  },
  async validateCenterOrganization(id: number) {
    return (await httpClient.post<CenterOrganizationRule>(`/organisation/regles-centres/${id}/valider-organisation/`, {}, { params: withScope() })).data
  },
  async markCenterReady(id: number) {
    return (await httpClient.post<CenterOrganizationRule>(`/organisation/regles-centres/${id}/marquer-prete-publication/`, {}, { params: withScope() })).data
  },
}
