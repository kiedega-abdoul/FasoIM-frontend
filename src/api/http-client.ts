import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios"

import { assignmentContextService } from "@/services/assignment-context-service"
import { tokenService } from "@/services/token-service"
import type { AuthTokens } from "@/types/auth"

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api"

export const httpClient = axios.create({
  baseURL: apiBaseUrl,
})

type RetryableRequest = InternalAxiosRequestConfig & {
  _retry?: boolean
}

httpClient.interceptors.request.use((config) => {
  const accessToken = tokenService.getAccessToken()

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  const assignmentId = assignmentContextService.getCurrentAssignmentId()
  if (assignmentId) {
    config.headers["X-FasoIM-Affectation"] = String(assignmentId)
  }

  const scope = assignmentContextService.getCurrentAssignmentScope()
  const method = String(config.method ?? "get").toLowerCase()
  const isReadRequest = method === "get" || method === "head"
  const isPublicRequest = String(config.url ?? "").includes("/public/")
    || String(config.url ?? "").startsWith("/auth/")

  if (scope && !scope.est_permanente && isReadRequest && !isPublicRequest) {
    const params = { ...(config.params ?? {}) } as Record<string, unknown>

    if (scope.session_id && params.session_id === undefined) {
      params.session_id = scope.session_id
    }
    if (scope.region_code && params.region_code === undefined) {
      params.region_code = scope.region_code
    }
    if (scope.centre_id && params.centre_id === undefined) {
      params.centre_id = scope.centre_id
    }

    config.params = params
  }

  return config
})

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const request = error.config as RetryableRequest | undefined

    if (error.response?.status !== 401 || !request || request._retry) {
      return Promise.reject(error)
    }

    const refreshToken = tokenService.getRefreshToken()
    if (!refreshToken) {
      tokenService.clearTokens()
      return Promise.reject(error)
    }

    request._retry = true

    try {
      const response = await axios.post<Pick<AuthTokens, "access">>(
        `${apiBaseUrl}/auth/token/refresh/`,
        { refresh: refreshToken },
      )

      tokenService.saveAccessToken(response.data.access)
      request.headers.Authorization = `Bearer ${response.data.access}`
      return httpClient(request)
    } catch (refreshError) {
      tokenService.clearTokens()

      if (!window.location.pathname.startsWith("/espace-acteur/connexion")) {
        window.location.assign("/espace-acteur/connexion")
      }

      return Promise.reject(refreshError)
    }
  },
)
