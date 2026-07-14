import type { ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/stores/auth-store"
import type { SessionStatus } from "./types"
import { STATUS_LABELS } from "./labels"

export function SessionPermissionGuard({ permission, children }: { permission: string; children: ReactNode }) {
  const ok = useAuthStore((s) => s.context?.affectation_courante?.permissions.includes(permission) ?? false)
  return ok ? <>{children}</> : null
}

export function SessionStatusBadge({ status }: { status: SessionStatus }) {
  const variant = status === "en_cours" || status === "ouverte" ? "default" : "secondary"
  return <Badge variant={variant}>{STATUS_LABELS[status] ?? status}</Badge>
}
