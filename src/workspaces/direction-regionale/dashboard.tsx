import { useEffect, useMemo, useState } from "react"
import { ArrowRight, Building2, CalendarRange, FileCheck2, Gauge, MapPinned, Route, Users } from "lucide-react"
import { Link } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { AFFECTATION_GROUPS } from "@/features/affectations/groups"
import { affectationsApi } from "@/features/affectations/api"
import type { CenterCapacityReport } from "@/features/affectations/types"
import { useAuthStore } from "@/stores/auth-store"

const modules = [
  {
    label: "Affectations aux centres",
    description: "Proposer, contrôler et valider la répartition des immergés entre les centres de votre région.",
    href: "/app/affectations-centres",
    permissions: AFFECTATION_GROUPS.CENTER_ASSIGNMENTS,
    icon: Route,
    disponible: true,
  },
  {
    label: "Gestion des attestations",
    description: "Contrôler, générer et signer les attestations de la région après la finalisation des centres.",
    href: null,
    permissions: [],
    icon: FileCheck2,
    disponible: false,
  },
] as const

export function RegionalDirectionDashboard() {
  const assignment = useAuthStore((state) => state.context?.affectation_courante)
  const permissions = assignment?.permissions ?? []
  const [report, setReport] = useState<CenterCapacityReport | null>(null)
  const [loading, setLoading] = useState(true)
  const sessionId = assignment?.session?.id ?? 0
  const regionCode = assignment?.region_code ?? ""

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const regions = await affectationsApi.regions()
        const region = regions.find((item) => item.code === regionCode)
        if (!region || !sessionId) return
        const data = await affectationsApi.centerCapacities(sessionId, region.id)
        if (active) setReport(data)
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => { active = false }
  }, [assignment?.id, regionCode, sessionId])

  const visibleModules = useMemo(
    () => modules.filter(
      (module) => module.permissions.length === 0
        || module.permissions.some((permission) => permissions.includes(permission)),
    ),
    [permissions],
  )

  const stats = [
    { label: "Session", value: assignment?.session?.nom || assignment?.session?.code || "Non définie", icon: CalendarRange },
    { label: "Région", value: report?.region?.nom || regionCode || "Non définie", icon: MapPinned },
    { label: "Centres d’accueil", value: report?.nombre_centres ?? 0, icon: Building2 },
    { label: "Immergés disponibles", value: report?.candidats_disponibles ?? 0, icon: Users },
    { label: "Places disponibles", value: report?.disponible_total ?? 0, icon: Gauge },
  ]

  return <div className="space-y-5">
    <section className="rounded-2xl bg-primary px-5 py-5 text-primary-foreground shadow-lg sm:px-6">
      <Badge variant="secondary" className="mb-3">Direction régionale</Badge>
      <h1 className="text-3xl font-bold tracking-tight">Pilotage régional des immersions</h1>
      <p className="mt-2 max-w-4xl text-base leading-6 text-primary-foreground/85">
        Répartissez les immergés affectés à votre région entre les centres retenus pour la session courante.
      </p>
    </section>

    <section>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Vue régionale</p>
      <h2 className="mt-1 text-2xl font-bold">Indicateurs de la région</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map(({ label, value, icon: Icon }) => <Card key={label}><CardContent className="flex items-center gap-4 p-5"><span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></span><div className="min-w-0"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 break-words text-xl font-bold leading-tight">{loading ? "…" : value}</p></div></CardContent></Card>)}
      </div>
    </section>

    <section>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Direction régionale</p>
      <h2 className="mt-1 text-2xl font-bold">Fonctionnalités disponibles</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {visibleModules.map(({ label, description, href, icon: Icon, disponible }) => {
          const content = <>
            <div className="flex items-start justify-between gap-4">
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              {disponible
                ? <ArrowRight className="size-5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
                : <Badge variant="secondary">Après finalisation</Badge>}
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
