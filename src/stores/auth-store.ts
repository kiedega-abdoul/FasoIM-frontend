import { create } from "zustand"

import { authApi } from "@/features/auth/api/auth-api"
import { tokenService } from "@/services/token-service"
import type { ContexteActeur, ListeAffectations } from "@/types/auth"

type AuthStatus = "idle" | "loading" | "authenticated" | "anonymous"

type AuthState = {
  status: AuthStatus
  context: ContexteActeur | null
  assignments: ListeAffectations | null
  assignmentsLoading: boolean
  login: (username: string, password: string) => Promise<void>
  initialize: () => Promise<void>
  loadAssignments: () => Promise<void>
  selectAssignment: (assignmentId: number) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: "idle",
  context: null,
  assignments: null,
  assignmentsLoading: false,

  async login(username, password) {
    set({ status: "loading" })

    try {
      const tokens = await authApi.login(username, password)
      tokenService.saveTokens(tokens)
      const context = await authApi.getCurrentContext()
      set({ status: "authenticated", context, assignments: null })
    } catch (error) {
      tokenService.clearTokens()
      set({ status: "anonymous", context: null, assignments: null })
      throw error
    }
  },

  async initialize() {
    if (get().status === "loading") {
      return
    }

    if (!tokenService.getAccessToken() && !tokenService.getRefreshToken()) {
      set({ status: "anonymous", context: null })
      return
    }

    set({ status: "loading" })

    try {
      const context = await authApi.getCurrentContext()
      set({ status: "authenticated", context })
    } catch {
      tokenService.clearTokens()
      set({ status: "anonymous", context: null, assignments: null })
    }
  },

  async loadAssignments() {
    set({ assignmentsLoading: true })

    try {
      const assignments = await authApi.getAssignments()
      set({ assignments })
    } finally {
      set({ assignmentsLoading: false })
    }
  },

  async selectAssignment(assignmentId) {
    const context = await authApi.getAssignmentContext(assignmentId)
    set({ context })
  },

  logout() {
    tokenService.clearTokens()
    set({ status: "anonymous", context: null, assignments: null })
  },
}))
