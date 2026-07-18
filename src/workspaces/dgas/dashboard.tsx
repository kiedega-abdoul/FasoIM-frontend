import {
  ArrowRight,
  CalendarRange,
  FileSpreadsheet,
  MapPinned,
  Route,
  UserCheck,
  Users,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { affectationsApi } from "@/features/affectations/api"
import { AFFECTATION_GROUPS } from "@/features/affectations/groups"
import { importsApi } from "@/features/imports/api"
import { IMPORT_GROUPS } from "@/features/imports/groups"
import { sessionsApi } from "@/features/sessions/api"
import { SESSION_GROUPS } from "@/features/sessions/groups"
import { PUBLIC_LABELS, SESSION_TYPE_LABELS } from "@/features/sessions/labels"
import { volunteerRequestsApi } from "@/features/volunteers/requests-api"
import {
  VOLUNTEER_REQUEST_ACCESS,
} from "@/features/volunteers/requests-permissions"
import { currentAssignmentSessionId } from "@/services/current-assignment-scope"
import { useAuthStore } from "@/stores/auth-store"

const baseModules = [
  {
    label: "Imports officiels",
    description: "Importer et contrôler les listes issues des examens, concours et sélections.",
    href: "/app/imports",
    permissions: IMPORT_GROUPS.MANAGEMENT,
    icon: FileSpreadsheet,
  },
  {
    label: "Demandes volontaires",
    description: "Examiner les demandes volontaires et accepter les dossiers conformes.",
    href: "/app/demandes-volontaires",
    permissions: VOLUNTEER_REQUEST_ACCESS,
    icon: UserCheck,
  },
  {
    label: "Immergés de la session",
    description: "Consulter les immergés centralisés, leur origine, leur statut et leur Code FasoIM.",
    href: "/app/immerges",
    permissions: ["lister_immerges"],
    icon: Users,
  },
  {
    label: "Affectations régionales",
    description: "Proposer, contrôler et valider l’affectation des immergés dans les régions.",
    href: "/app/affectations-regionales",
    permissions: AFFECTATION_GROUPS.REGIONAL_ASSIGNMENTS,
    icon: Route,
  },
  {
    label: "Détails de la session",
    description: "Consulter les informations, les services prévus et les centres d’accueil de la session.",
    href: "/app/sessions",
    permissions: SESSION_GROUPS.MANAGEMENT,
    icon: CalendarRange,
  },
] as const

type DgasStats = {
  sessionNom: string
  typeEtPublic: string
  imports: number
  demandesEnAttente: number
  affectationsProposees: number
  affectationsActives: number
}

const emptyStats: DgasStats = {
  sessionNom: "Non définie",
  typeEtPublic: "Non défini",
  imports: 0,
  demandesEnAttente: 0,
  affectationsProposees: 0,
  affectationsActives: 0,
}

export function DgasDashboard() {
  const context = useAuthStore((state) => state.context)
  const assignment = context?.affectation_courante
  const permissions = assignment?.permissions ?? []
  const [stats, setStats] = useState<DgasStats>(emptyStats)
  const [statsLoading, setStatsLoading] = useState(true)
  const sessionId = assignment?.session?.id ?? null

  const [sessionAcceptsVolunteerRequests, setSessionAcceptsVolunteerRequests] = useState(false)
  const sessionDisplayName = assignment?.session?.nom?.trim()
    || assignment?.session?.code?.trim()
    || (sessionId ? `Session #${sessionId}` : "Non définie")

  const visibleModules = useMemo(
    () => baseModules.filter((module) => {
      if (module.href === "/app/demandes-volontaires" && !sessionAcceptsVolunteerRequests) {
        return false
      }

      return module.permissions.some((permission) => permissions.includes(permission))
    }),
    [permissions, sessionAcceptsVolunteerRequests],
  )

  useEffect(() => {
    let active = true

    const currentSessionId = sessionId ?? currentAssignmentSessionId()
    const sessionParams = currentSessionId ? { session_id: currentSessionId } : {}

    sessionsApi.sessions({ ...sessionParams, page_size: 1000 })
      .then(async (sessions) => {
        if (!active) return

        const assignedSession = currentSessionId
          ? sessions.find((session) => session.id === currentSessionId) ?? null
          : null
        const acceptsVolunteerRequests = Boolean(
          assignedSession?.accepte_inscription_volontaire
          || assignedSession?.type_session === "volontaire"
          || assignedSession?.type_session === "mixte",
        )

        setSessionAcceptsVolunteerRequests(acceptsVolunteerRequests)

        const [imports, demandes, affectations] = await Promise.all([
          importsApi.list({ ...sessionParams, page_size: 1000 }),
          acceptsVolunteerRequests
            ? volunteerRequestsApi.list({ ...sessionParams, page_size: 1000 })
            : Promise.resolve([]),
          affectationsApi.regionalAssignments({ ...sessionParams, page_size: 1000 }),
        ])

        if (!active) return

        setStats({
          sessionNom: assignedSession?.nom?.trim() || sessionDisplayName,
          typeEtPublic: assignedSession
            ? `${SESSION_TYPE_LABELS[assignedSession.type_session] ?? assignedSession.type_session} · ${PUBLIC_LABELS[assignedSession.public_cible] ?? assignedSession.public_cible}`
            : "Non défini",
          imports: imports.length,
          demandesEnAttente: demandes.filter((demande) => demande.statut_demande === "EN_ATTENTE").length,
          affectationsProposees: affectations.filter((affectation) => affectation.statut === "PROPOSEE").length,
          affectationsActives: affectations.filter((affectation) => affectation.statut === "ACTIVE").length,
        })
      })
      .catch(() => {
        if (active) setStats(emptyStats)
      })
      .finally(() => {
        if (active) setStatsLoading(false)
      })

    return () => { active = false }
  }, [assignment?.id, sessionDisplayName, sessionId])

  const statCards = [
    { label: "Session d’affectation", value: sessionDisplayName, icon: CalendarRange, alwaysVisible: true },
    { label: "Type et public cible", value: stats.typeEtPublic, icon: Users, alwaysVisible: false },
    { label: "Imports officiels", value: stats.imports, icon: FileSpreadsheet, alwaysVisible: false },
    ...(sessionAcceptsVolunteerRequests
      ? [{ label: "Demandes en attente", value: stats.demandesEnAttente, icon: Users, alwaysVisible: false }]
      : []),
    { label: "Affectations proposées", value: stats.affectationsProposees, icon: MapPinned, alwaysVisible: false },
    { label: "Affectations actives", value: stats.affectationsActives, icon: Route, alwaysVisible: false },
  ] as const

  return (
    <div className="space-y-5">
      <section className="rounded-2xl bg-primary px-5 py-5 text-primary-foreground shadow-lg sm:px-6">
        <Badge variant="secondary" className="mb-3">DGAS</Badge>
        <h1 className="text-3xl font-bold tracking-tight">Direction Générale des Appuis Spécifiques</h1>
        <p className="mt-2 max-w-4xl text-base leading-6 text-primary-foreground/85">
          Pilotez l’entrée des immergés et leur affectation dans les régions pour la session courante.
        </p>
      </section>

      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Vue nationale</p>
        <h2 className="mt-1 text-2xl font-bold">Indicateurs de pilotage</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {statCards.map(({ label, value, icon: Icon, alwaysVisible }) => (
            <Card key={label}>
              <CardContent className="flex items-center gap-4 p-5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="mt-1 break-words text-xl font-bold leading-tight">
                    {alwaysVisible ? value : statsLoading ? "…" : value}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">DGAS</p>
        <h2 className="mt-1 text-2xl font-bold">Fonctionnalités disponibles</h2>

        {visibleModules.length ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {visibleModules.map(({ label, description, href, icon: Icon }) => {
              const targetHref = label === "Détails de la session" && sessionId
                ? `/app/sessions/${sessionId}`
                : href
              return (
                <Link
                key={href}
                to={targetHref}
                className="group rounded-2xl border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <ArrowRight className="size-5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
                </div>
                <h3 className="mt-4 text-base font-semibold">{label}</h3>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
                </Link>
              )
            })}
          </div>
        ) : (
          <Card className="mt-4">
            <CardContent className="p-5">
              <h3 className="font-semibold">Aucune opération disponible</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                L’affectation DGAS actuelle ne contient encore aucune permission opérationnelle.
              </p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  )
}
