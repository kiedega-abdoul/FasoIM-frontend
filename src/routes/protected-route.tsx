import { LoaderCircle } from "lucide-react"
import { useEffect } from "react"
import { Navigate, Outlet, useLocation } from "react-router-dom"

import { useAuthStore } from "@/stores/auth-store"

export function ProtectedRoute() {
  const location = useLocation()
  const status = useAuthStore((state) => state.status)
  const initialize = useAuthStore((state) => state.initialize)

  useEffect(() => {
    if (status === "idle") {
      void initialize()
    }
  }, [initialize, status])

  if (status === "idle" || status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="flex items-center gap-3 text-base text-muted-foreground">
          <LoaderCircle className="size-5 animate-spin text-primary" />
          Chargement de votre espace…
        </div>
      </div>
    )
  }

  if (status !== "authenticated") {
    return (
      <Navigate
        to="/espace-acteur/connexion"
        replace
        state={{ from: location.pathname }}
      />
    )
  }

  return <Outlet />
}
