import {
  BadgeCheck,
  FileSearch,
  Home,
  MapPin,
  Siren,
  UserRound,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export type WorkspaceNavigationItem = {
  label: string
  href: string
  icon: LucideIcon
  end?: boolean
}

export type WorkspaceNavigationSection = {
  label: string
  items: WorkspaceNavigationItem[]
}

const fixedNavigation: WorkspaceNavigationSection[] = [
  {
    label: "Navigation",
    items: [
      { label: "Mon tableau de bord", href: "/app", icon: Home, end: true },
      { label: "Mes affectations", href: "/app/mes-affectations", icon: MapPin },
      { label: "Mon profil", href: "/app/profil", icon: UserRound },
      { label: "Consulter une immersion", href: "/app/consultation", icon: FileSearch },
      { label: "Vérifier une attestation", href: "/app/verification-attestation", icon: BadgeCheck },
      { label: "Incidents", href: "/app/incidents", icon: Siren },
    ],
  },
]

export function getWorkspaceNavigation(): WorkspaceNavigationSection[] {
  return fixedNavigation
}
