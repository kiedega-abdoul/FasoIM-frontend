import { httpClient } from "@/api/http-client"
import type {
  AuthTokens,
  ContexteActeur,
  ListeAffectations,
} from "@/types/auth"

export const authApi = {
  async login(username: string, password: string) {
    const response = await httpClient.post<AuthTokens>("/auth/token/", {
      username,
      password,
    })
    return response.data
  },

  async getCurrentContext() {
    const response = await httpClient.get<ContexteActeur>(
      "/accounts/acteurs/mon-contexte/",
    )
    return response.data
  },

  async getAssignments() {
    const response = await httpClient.get<ListeAffectations>(
      "/accounts/acteurs/mes-affectations/",
    )
    return response.data
  },

  async getAssignmentContext(assignmentId: number) {
    const response = await httpClient.get<ContexteActeur>(
      `/accounts/acteurs/contexte-affectation/${assignmentId}/`,
    )
    return response.data
  },
}
