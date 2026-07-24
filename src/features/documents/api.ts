import { httpClient } from "@/api/http-client"
import { currentScopeParams } from "@/features/affectations/scope"
import type { FinalResult, FinalResultStatistics, GeneratedDocument, ListResponse, OfficialPublication, PaginatedResponse, PublicArrivalInformation, RegionalCertificateStatistics, TaskLaunch, TaskProgress } from "./types"

const list = <T>(data: ListResponse<T>) => Array.isArray(data) ? data : data.results
const withScope = (params?: Record<string, string | number | undefined>) => ({
  ...currentScopeParams(),
  ...params,
})

export const documentsApi = {
  async publicArrival(data: { type_immerge: string; identifiant: string; session_code: string; date_naissance: string }) {
    return (await httpClient.post<PublicArrivalInformation>("/documents/public/arrivee/", data)).data
  },
  async publishArrival(sessionId: number, centerId: number) {
    return (await httpClient.post<OfficialPublication>("/documents/publications/soumettre-arrivee/", { session_id: sessionId, centre_id: centerId }, { params: withScope() })).data
  },
  async finalResults(params?: Record<string, string | number | undefined>) {
    return list((await httpClient.get<ListResponse<FinalResult>>("/documents/resultats/", { params: withScope(params) })).data)
  },
  async finalResultsPage(params?: Record<string, string | number | undefined>) {
    return (await httpClient.get<PaginatedResponse<FinalResult>>("/documents/resultats/", { params: withScope(params) })).data
  },
  async finalResultStatistics(params?: Record<string, string | number | undefined>) {
    return (await httpClient.get<FinalResultStatistics>("/documents/resultats/statistiques/", { params: withScope(params) })).data
  },
  async publications(params?: Record<string, string | number | undefined>) {
    return list((await httpClient.get<ListResponse<OfficialPublication>>("/documents/publications/", { params: withScope(params) })).data)
  },
  async generatedDocuments(params?: Record<string, string | number | undefined>) {
    return list((await httpClient.get<ListResponse<GeneratedDocument>>("/documents/fichiers/", { params: withScope(params) })).data)
  },
  async generatedDocumentsPage(params?: Record<string, string | number | undefined>) {
    return (await httpClient.get<PaginatedResponse<GeneratedDocument>>("/documents/fichiers/", { params: withScope(params) })).data
  },
  async calculateCenter(sessionId: number, centerId: number) {
    return (await httpClient.post<TaskLaunch>("/documents/resultats/calculer-centre/", { session_id: sessionId, centre_id: centerId }, { params: withScope() })).data
  },
  async validateCenter(sessionId: number, centerId: number) {
    return (await httpClient.post<Record<string, number>>("/documents/resultats/valider-centre/", { session_id: sessionId, centre_id: centerId }, { params: withScope() })).data
  },
  async generateCertificates(sessionId: number, centerId: number) {
    return (await httpClient.post<TaskLaunch>("/documents/fichiers/generer-attestations/", { session_id: sessionId, centre_id: centerId }, { params: withScope() })).data
  },
  async submitCertificates(sessionId: number, centerId: number) {
    return (await httpClient.post<OfficialPublication>("/documents/publications/soumettre-attestations/", { session_id: sessionId, centre_id: centerId }, { params: withScope() })).data
  },
  async regionalCertificateStatistics(sessionId: number) {
    return (await httpClient.get<RegionalCertificateStatistics>("/documents/publications/statistiques-attestations-region/", { params: withScope({ session_id: sessionId }) })).data
  },
  async validateRegionalCertificates(publicationId: number) {
    return (await httpClient.post<Record<string, number | boolean>>(`/documents/publications/${publicationId}/valider-attestations/`, {}, { params: withScope() })).data
  },
  async rejectRegionalCertificates(publicationId: number, motif: string) {
    return (await httpClient.post<OfficialPublication>(`/documents/publications/${publicationId}/rejeter-region/`, { motif }, { params: withScope() })).data
  },
  async taskProgress(taskId: string) {
    return (await httpClient.get<TaskProgress>(`/documents/fichiers/progression/${taskId}/`, { params: withScope() })).data
  },
}
