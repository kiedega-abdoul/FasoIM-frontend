import type { AuthTokens } from "@/types/auth"

const ACCESS_TOKEN_KEY = "fasoim_access_token"
const REFRESH_TOKEN_KEY = "fasoim_refresh_token"

export const tokenService = {
  getAccessToken() {
    return window.localStorage.getItem(ACCESS_TOKEN_KEY)
  },

  getRefreshToken() {
    return window.localStorage.getItem(REFRESH_TOKEN_KEY)
  },

  saveTokens(tokens: AuthTokens) {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access)
    window.localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh)
  },

  saveAccessToken(accessToken: string) {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  },

  clearTokens() {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY)
    window.localStorage.removeItem(REFRESH_TOKEN_KEY)
  },
}
