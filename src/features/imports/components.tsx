import type { ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/stores/auth-store"
import { STATUS_LABELS } from "./labels"
import type { ImportStatus } from "./types"

export function ImportPermissionGuard({permission,children}:{permission:string;children:ReactNode}){const ok=useAuthStore(s=>s.context?.affectation_courante?.permissions.includes(permission)??false);return ok?<>{children}</>:null}
export function ImportStatusBadge({status}:{status:ImportStatus}){const variant=status==="TERMINE"||status==="VALIDE"?"default":status==="ECHEC"||status==="ANNULE"?"destructive":"secondary";return <Badge variant={variant}>{STATUS_LABELS[status]}</Badge>}
