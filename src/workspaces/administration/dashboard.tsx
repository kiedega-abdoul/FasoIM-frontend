import {
  ArrowRight,
  BookOpenCheck,
  Boxes,
  Building2,
  CalendarRange,
  ClipboardList,
  MapPin,
  MapPinned,
  ShieldCheck,
  UtensilsCrossed,
  Users,
} from "lucide-react"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { accountsApi } from "@/features/accounts/api"
import { affectationsApi } from "@/features/affectations/api"
import { ACCOUNT_GROUPS } from "@/features/accounts/groups"
import { AFFECTATION_GROUPS } from "@/features/affectations/groups"
import { SESSION_GROUPS } from "@/features/sessions/groups"
import { KITS_GROUPS } from "@/features/kits/groups"
import { ACTIVITES_ACCESS } from "@/features/activites/permissions"
import { sessionsApi } from "@/features/sessions/api"
import { useAuthStore } from "@/stores/auth-store"

const modules = [
  {
    label: "Sessions d’immersion",
    description: "Créer, paramétrer et suivre les sessions nationales d’immersion.",
    href: "/app/sessions",
    permissions: SESSION_GROUPS.MANAGEMENT,
    icon: CalendarRange,
  },
  {
    label: "Acteurs",
    description: "Gérer les comptes des acteurs internes de la plateforme.",
    href: "/app/acteurs",
    permissions: ACCOUNT_GROUPS.ACTORS,
    icon: Users,
  },
  {
    label: "Affectations",
    description: "Définir le rôle, la session et le périmètre de travail de chaque acteur.",
    href: "/app/affectations",
    permissions: ACCOUNT_GROUPS.ASSIGNMENTS,
    icon: MapPin,
  },
  {
    label: "Régions",
    description: "Administrer le référentiel national des régions d’immersion.",
    href: "/app/regions",
    permissions: AFFECTATION_GROUPS.REGIONS,
    icon: MapPinned,
  },
  {
    label: "Centres",
    description: "Administrer les centres d’accueil et leurs informations principales.",
    href: "/app/centres",
    permissions: AFFECTATION_GROUPS.CENTERS,
    icon: Building2,
  },
  {
    label: "Activités, séances et évaluations",
    description: "Gérer le catalogue, planifier les séances et créer les évaluations liées.",
    href: "/app/activites",
    permissions: ACTIVITES_ACCESS,
    icon: BookOpenCheck,
  },
  {
    label: "Kits à remettre",
    description: "Définir les articles nationaux à remettre aux immergés.",
    href: "/app/kits?type=A_REMETTRE",
    permissions: KITS_GROUPS.ARTICLES,
    icon: Boxes,
  },
] as const

const plannedModules = [
  { label: "Demandes d’alimentation", description: "Validation et consolidation des demandes des centres.", icon: UtensilsCrossed },
  { label: "Propositions de clôture", description: "Contrôle des blocages et confirmation administrative.", icon: ClipboardList },
  { label: "Supervision et audit", description: "Journaux, statistiques, sécurité et suivi technique.", icon: ShieldCheck },
] as const

type AdministrationStats = {
  sessions: number
  acteurs: number
  affectations: number
  regions: number
  centres: number
}

const emptyStats: AdministrationStats = { sessions: 0, acteurs: 0, affectations: 0, regions: 0, centres: 0 }

export function AdministrationDashboard() {
  const context = useAuthStore((state) => state.context)
  const assignment = context?.affectation_courante
  const permissions = assignment?.permissions ?? []
  const [stats, setStats] = useState<AdministrationStats>(emptyStats)
  const [statsLoading, setStatsLoading] = useState(true)
  const visibleModules = modules.filter((module) =>
    module.permissions.some((permission) => permissions.includes(permission)),
  )

  useEffect(() => {
    let active = true

    Promise.all([
      sessionsApi.sessions({ page_size: 1000 }),
      accountsApi.actors({ page_size: 1000 }),
      accountsApi.assignments({ page_size: 1000 }),
      affectationsApi.regions({ page_size: 1000 }),
      affectationsApi.centers({ page_size: 1000 }),
    ])
      .then(([sessions, acteurs, affectations, regions, centres]) => {
        if (!active) return
        setStats({
          sessions: sessions.length,
          acteurs: acteurs.length,
          affectations: affectations.length,
          regions: regions.length,
          centres: centres.length,
        })
      })
      .catch(() => {
        if (active) setStats(emptyStats)
      })
      .finally(() => {
        if (active) setStatsLoading(false)
      })

    return () => { active = false }
  }, [assignment?.id])

  return (
    <div className="space-y-5">
      <section className="rounded-2xl bg-primary px-5 py-5 text-primary-foreground shadow-lg sm:px-6">
        <Badge variant="secondary" className="mb-3">Administration</Badge>
        <h1 className="text-3xl font-bold tracking-tight">Administration de la plateforme</h1>
        <p className="mt-2 max-w-3xl text-base leading-6 text-primary-foreground/85">
          Supervisez les sessions, les acteurs, les affectations et les référentiels nationaux de FasoIM.
        </p>
      </section>

      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Vue d’ensemble</p>
        <h2 className="mt-1 text-2xl font-bold">Statistiques de la plateforme</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {[
            { label: "Sessions", value: stats.sessions, icon: CalendarRange },
            { label: "Acteurs", value: stats.acteurs, icon: Users },
            { label: "Affectations", value: stats.affectations, icon: MapPin },
            { label: "Régions", value: stats.regions, icon: MapPinned },
            { label: "Centres", value: stats.centres, icon: Building2 },
          ].map(({ label, value, icon: Icon }) => (
            <Card key={label}>
              <CardContent className="flex items-center gap-4 p-5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></span>
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="mt-1 text-2xl font-bold">{statsLoading ? "…" : value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Administration</p>
        <h2 className="mt-1 text-2xl font-bold">Fonctionnalités disponibles</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {visibleModules.map(({ label, description, href, icon: Icon }) => (
            <Link key={href} to={href} className="group rounded-2xl border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
              <div className="flex items-start justify-between gap-4">
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></span>
                <ArrowRight className="size-5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
              </div>
              <h3 className="mt-4 text-base font-semibold">{label}</h3>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
            </Link>
          ))}
          {plannedModules.map(({ label, description, icon: Icon }) => (
            <div key={label} className="rounded-2xl border border-dashed bg-muted/25 p-4">
              <div className="flex items-start justify-between gap-4">
                <span className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground"><Icon className="size-5" /></span>
                <Badge variant="outline">Prévu</Badge>
              </div>
              <h3 className="mt-4 text-base font-semibold">{label}</h3>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
