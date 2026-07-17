import { httpClient } from "@/api/http-client"
import { assignmentContextService } from "@/services/assignment-context-service"
import type { ImmersionSession, ListResponse, PublicSession, SessionParameters, SessionParametersPayload, SessionPayload } from "./types"

const list = <T>(data: ListResponse<T>) => Array.isArray(data) ? data : data.results

export const sessionsApi = {
  async sessions(params?: Record<string, string | number | boolean | undefined>) {
    const response = await httpClient.get<ListResponse<ImmersionSession>>("/sessions/sessions/", { params })
    const rows = list(response.data)
    const scope = assignmentContextService.getCurrentAssignmentScope()

    if (!scope || scope.est_permanente || !scope.session_id) return rows
    return rows.filter((session) => session.id === scope.session_id)
  },
  async session(id: number) {
    const scope = assignmentContextService.getCurrentAssignmentScope()
    if (scope && !scope.est_permanente && scope.session_id && scope.session_id !== id) {
      throw new Error("Cette session ne correspond pas à votre affectation courante.")
    }
    return (await httpClient.get<ImmersionSession>(`/sessions/sessions/${id}/`)).data
  },
  async create(data: SessionPayload) {
    return (await httpClient.post<ImmersionSession>("/sessions/sessions/", data)).data
  },
  async update(id: number, data: Partial<SessionPayload>) {
    return (await httpClient.patch<ImmersionSession>(`/sessions/sessions/${id}/`, data)).data
  },
  async configureParameters(sessionId: number, data: SessionParametersPayload) {
    return (await httpClient.post<SessionParameters>("/sessions/parametres/", { session: sessionId, ...data })).data
  },
  async updateParameters(id: number, data: Partial<SessionParametersPayload>) {
    return (await httpClient.patch<SessionParameters>(`/sessions/parametres/${id}/`, data)).data
  },
  async open(id: number) { return (await httpClient.post<ImmersionSession>(`/sessions/sessions/${id}/ouvrir/`)).data },
  async prepare(id: number) { return (await httpClient.post<ImmersionSession>(`/sessions/sessions/${id}/mettre-en-preparation/`)).data },
  async start(id: number) { return (await httpClient.post<ImmersionSession>(`/sessions/sessions/${id}/demarrer/`)).data },
  async finish(id: number) { return (await httpClient.post<ImmersionSession>(`/sessions/sessions/${id}/terminer/`)).data },
  async archive(id: number) { return (await httpClient.post<ImmersionSession>(`/sessions/sessions/${id}/archiver/`)).data },
  async cancel(id: number, motif: string) { return (await httpClient.post<ImmersionSession>(`/sessions/sessions/${id}/annuler/`, { motif })).data },
  async remove(id: number) { await httpClient.delete(`/sessions/sessions/${id}/`) },
  async history() {
    const response = await httpClient.get<ListResponse<ImmersionSession>>("/sessions/sessions/historique/")
    return list(response.data)
  },
  async publicOpenSessions() {
    const response = await httpClient.get<ListResponse<PublicSession>>("/sessions/public/ouvertes-inscription/")
    return list(response.data)
  },
}
