import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios"

import { tokenService } from "@/services/token-service"
import type { AuthTokens } from "@/types/auth"

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api"

export const httpClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
})

type RetryableRequest = InternalAxiosRequestConfig & {
  _retry?: boolean
}

httpClient.interceptors.request.use((config) => {
  const accessToken = tokenService.getAccessToken()

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
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
