import { httpClient } from "@/api/http-client"
import type { ImmersionSession, ListResponse, PublicSession, SessionParameters, SessionParametersPayload, SessionPayload } from "./types"

const list = <T>(data: ListResponse<T>) => Array.isArray(data) ? data : data.results

export const sessionsApi = {
  async sessions(params?: Record<string, string | number | boolean | undefined>) {
    const response = await httpClient.get<ListResponse<ImmersionSession>>("/sessions/sessions/", { params })
    return list(response.data)
  },
  async session(id: number) {
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
    const response = await httpClient.get<ListResponse<PublicSession>>("/public/sessions/ouvertes-inscription/")
    return list(response.data)
  },
}
