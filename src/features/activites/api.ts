import { httpClient } from "@/api/http-client"
import { currentScopeParams } from "@/features/affectations/scope"
import type { Evaluation, ListResponse, ModuleActivite, Note, PageResponse, Presence, Seance, TaskLaunch, TaskProgress } from "./types"

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
  async seance(id: number) {
    return (await httpClient.get<Seance>(`/activites/seances/${id}/`, { params: withScope() })).data
  },
  async createSeance(data: Record<string, unknown>) {
    return (await httpClient.post<Seance>("/activites/seances/", data, { params: withScope() })).data
  },
  async demarrerSeance(id: number) {
    return (await httpClient.post<Seance>(`/activites/seances/${id}/demarrer/`, {}, { params: withScope() })).data
  },
  async terminerSeance(id: number) {
    return (await httpClient.post<Seance>(`/activites/seances/${id}/terminer/`, {}, { params: withScope() })).data
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
  async ouvrirEvaluation(id: number) {
    return (await httpClient.post<Evaluation>(`/activites/evaluations/${id}/ouvrir-saisie/`, {}, { params: withScope() })).data
  },
  async cloturerEvaluation(id: number) {
    return (await httpClient.post<Evaluation>(`/activites/evaluations/${id}/cloturer/`, {}, { params: withScope() })).data
  },
  async presences(seanceId: number, page = 1) {
    const data = (await httpClient.get<ListResponse<Presence>>("/activites/presences/", {
      params: withScope({ seance_id: seanceId, page, page_size: 50 }),
    })).data

    if (Array.isArray(data)) {
      return { count: data.length, next: null, previous: null, results: data } satisfies PageResponse<Presence>
    }

    return data
  },
  async preparerFeuille(seanceId: number) {
    return (await httpClient.post<TaskLaunch>("/activites/operations/preparer-feuille/", { seance_id: seanceId }, { params: withScope() })).data
  },
  async operation(taskId: string) {
    return (await httpClient.get<TaskProgress>(`/activites/operations/${taskId}/`, { params: withScope() })).data
  },
  async saisirPresence(data: Record<string, unknown>) {
    return (await httpClient.post<Presence>("/activites/presences/", data, { params: withScope() })).data
  },
  async saisirPresences(seanceId: number, lignes: Array<Record<string, unknown>>) {
    return (await httpClient.post<TaskLaunch>("/activites/operations/saisir-presences/", { seance_id: seanceId, lignes }, { params: withScope() })).data
  },
  async validerFeuille(seanceId: number) {
    return (await httpClient.post<Seance>("/activites/presences/valider-feuille/", { seance_id: seanceId }, { params: withScope() })).data
  },
  async cloturerFeuille(seanceId: number) {
    return (await httpClient.post<Seance>("/activites/presences/cloturer-feuille/", { seance_id: seanceId }, { params: withScope() })).data
  },
  async notes(evaluationId: number, page = 1) {
    const data = (await httpClient.get<ListResponse<Note>>("/activites/notes/", {
      params: withScope({ evaluation_id: evaluationId, page, page_size: 50 }),
    })).data

    if (Array.isArray(data)) {
      return { count: data.length, next: null, previous: null, results: data } satisfies PageResponse<Note>
    }

    return data
  },
  async confirmerTousPresents(seanceId: number) {
    return (await httpClient.post<Seance>("/activites/presences/confirmer-tous-presents/", { seance_id: seanceId }, { params: withScope() })).data
  },
  async noterTous(evaluationId: number, valeur: number) {
    return (await httpClient.post<{ total_presents: number; notes_creees: number; notes_conservees: number; valeur: string | number }>("/activites/notes/noter-tous/", { evaluation_id: evaluationId, valeur }, { params: withScope() })).data
  },
  async saisirNote(data: Record<string, unknown>) {
    return (await httpClient.post<Note>("/activites/notes/", data, { params: withScope() })).data
  },
}
