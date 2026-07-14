import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuthStore } from "@/stores/auth-store"

type PermissionRouteProps = {
  permission?: string
  permissions?: string[]
}

export function PermissionRoute({ permission, permissions = [] }: PermissionRouteProps) {
  const location = useLocation()
  const effectivePermissions = useAuthStore(
    (state) => state.context?.affectation_courante?.permissions ?? [],
  )
  const required = permission ? [permission, ...permissions] : permissions
  const authorized = required.some((code) => effectivePermissions.includes(code))

  return authorized ? (
    <Outlet />
  ) : (
    <Navigate to="/app" replace state={{ denied: location.pathname }} />
  )
}
