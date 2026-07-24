import { useEffect, useMemo, useState } from "react"
import {
  ArrowRight,
  BedDouble,
  Building2,
  CalendarRange,
  ClipboardCheck,
  Layers3,
  ListChecks,
  PackageCheck,
  Presentation,
  Users,
} from "lucide-react"
import { Link } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { AFFECTATION_GROUPS } from "@/features/affectations/groups"
import { affectationsApi } from "@/features/affectations/api"
import type { Center, CenterCapacityReport } from "@/features/affectations/types"
import { IMMERGE_PERMISSIONS } from "@/features/immerges/permissions"
import { KITS_GROUPS } from "@/features/kits/groups"
import { ORGANISATION_GROUPS } from "@/features/organisation/groups"
import { ACTIVITES_ACCESS } from "@/features/activites/permissions"
import { useAuthStore } from "@/stores/auth-store"

const modules = [
  {
    label: "Mon centre",
    description: "Consulter l’identité, la localisation, la capacité et les conditions d’accueil de votre centre.",
    href: "/app/mon-centre",
    permissions: AFFECTATION_GROUPS.CENTERS,
    icon: Building2,
    disponible: true,
  },
  {
    label: "Immergés du centre",
    description: "Consulter les immergés officiellement affectés à votre centre pour la session courante.",
    href: "/app/immerges-centre",
    permissions: [IMMERGE_PERMISSIONS.LIST],
    icon: Users,
    disponible: true,
  },
  {
    label: "Organisation du centre",
    description: "Définir les règles, capacités, seuils et consignes de fonctionnement du centre.",
    href: "/app/organisation-centre",
    permissions: ORGANISATION_GROUPS.CENTER_ORGANIZATION,
    icon: ListChecks,
    disponible: true,
  },
  {
    label: "Répartition interne",
    description: "Répartir les immergés dans les sections et les groupes du centre.",
    href: "/app/repartition-interne",
    permissions: ORGANISATION_GROUPS.INTERNAL_DISTRIBUTION,
    icon: Layers3,
    disponible: true,
  },
  {
    label: "Hébergement",
    description: "Créer les dortoirs, générer leurs lits et consulter les places disponibles.",
    href: "/app/dortoirs",
    permissions: ORGANISATION_GROUPS.HOSTING,
    icon: BedDouble,
    disponible: true,
  },
  {
    label: "Kits",
    description: "Gérer les articles à apporter, les articles à remettre et le suivi des remises.",
    href: "/app/kits",
    permissions: KITS_GROUPS.ACCESS,
    icon: PackageCheck,
    disponible: true,
  },
  {
    label: "Séances",
    description: "Planifier et suivre les séances, les formateurs, les groupes concernés et les présences associées.",
    href: "/app/activites",
    permissions: ACTIVITES_ACCESS,
    icon: Presentation,
    disponible: true,
  },
  {
    label: "Finalisation du centre",
    description: "Valider l’organisation puis déclarer le centre prêt à accueillir les immergés.",
    href: "/app/finalisation-centre",
    permissions: ORGANISATION_GROUPS.CENTER_ORGANIZATION,
    icon: ClipboardCheck,
    disponible: true,
  },
] as const

export function CenterManagerDashboard() {
  const assignment = useAuthStore((state) => state.context?.affectation_courante)
  const permissions = assignment?.permissions ?? []
  const [center, setCenter] = useState<Center | null>(null)
  const [capacityReport, setCapacityReport] = useState<CenterCapacityReport | null>(null)
  const [loading, setLoading] = useState(true)
  const centerId = assignment?.centre_id ?? 0
  const sessionId = assignment?.session?.id ?? 0

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      try {
        if (!centerId) {
          if (active) {
            setCenter(null)
            setCapacityReport(null)
          }
          return
        }

        const data = await affectationsApi.center(centerId)
        if (!active) return
        setCenter(data)

        const resolvedRegionId = data.region?.id ?? 0
        if (sessionId && resolvedRegionId) {
          const report = await affectationsApi.centerCapacities(sessionId, resolvedRegionId)
          if (active) setCapacityReport(report)
        } else {
          setCapacityReport(null)
        }
      } catch {
        if (active) {
          setCenter(null)
          setCapacityReport(null)
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => { active = false }
  }, [centerId, sessionId])

  const visibleModules = useMemo(
    () => modules.filter((module) => (
      module.permissions.some((permission) => permissions.includes(permission))
    )),
    [permissions],
  )

  const currentCenterCapacity = capacityReport?.centres?.find((entry) => entry.centre_id === centerId)

  const stats = [
    {
      label: "Session",
      value: assignment?.session?.nom || assignment?.session?.code || "Non définie",
      icon: CalendarRange,
    },
    {
      label: "Centre",
      value: center?.nom || (centerId ? `Centre #${centerId}` : "Non défini"),
      icon: Building2,
    },
    {
      label: "Région",
      value: center?.region?.nom || center?.region?.code || assignment?.region_code || "Non définie",
      icon: Layers3,
    },
    {
      label: "Immergés affectés",
      value: currentCenterCapacity?.affectations_validees ?? 0,
      icon: Users,
    },
    {
      label: "Places ouvertes",
      value: currentCenterCapacity?.capacite_ouverte ?? 0,
      icon: ClipboardCheck,
    },
  ]

  return <div className="space-y-5">
    <section className="rounded-2xl bg-primary px-5 py-5 text-primary-foreground shadow-lg sm:px-6">
      <Badge variant="secondary" className="mb-3">Responsable de centre</Badge>
      <h1 className="text-3xl font-bold tracking-tight">Gestion opérationnelle du centre</h1>
      <p className="mt-2 max-w-4xl text-base leading-6 text-primary-foreground/85">
        Organisez les immergés affectés à votre centre et suivez les opérations nécessaires jusqu’à la finalisation.
      </p>
    </section>

    <section>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Contexte actif</p>
      <h2 className="mt-1 text-2xl font-bold">
        Votre centre pour la session {assignment?.session?.nom || assignment?.session?.code || "courante"}
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map(({ label, value, icon: Icon }) => <Card key={label}>
          <CardContent className="flex items-center gap-4 p-5">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-1 break-words text-xl font-bold leading-tight">{loading ? "…" : value}</p>
            </div>
          </CardContent>
        </Card>)}
      </div>
    </section>

    <section>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Responsable de centre</p>
      <h2 className="mt-1 text-2xl font-bold">Fonctionnalités du centre</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visibleModules.map(({ label, description, href, icon: Icon, disponible }) => {
          const content = <>
            <div className="flex items-start justify-between gap-4">
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              {disponible
                ? <ArrowRight className="size-5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
                : <Badge variant="secondary">À construire</Badge>}
            </div>
            <h3 className="mt-4 text-base font-semibold">{label}</h3>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
          </>

          if (!disponible || !href) {
            return <article key={label} className="rounded-2xl border bg-card/70 p-4 shadow-sm opacity-80" aria-disabled="true">
              {content}
            </article>
          }

          return <Link key={href} to={href} className="group rounded-2xl border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
            {content}
          </Link>
        })}
      </div>
    </section>
  </div>
}
