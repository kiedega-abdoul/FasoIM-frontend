import { useEffect, useState } from "react"
import { ArrowRight, Building2, CalendarDays, ClipboardCheck, Clock3, MapPinned } from "lucide-react"
import { Link } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { affectationsApi } from "@/features/affectations/api"
import type { Center } from "@/features/affectations/types"
import { useAuthStore } from "@/stores/auth-store"

const modules = [
  {
    label: "Mes séances",
    description: "Consulter vos séances, les commencer et enregistrer les présences des immergés.",
    href: "/app/formateur/seances",
    icon: CalendarDays,
  },
  {
    label: "Évaluations et notes",
    description: "Saisir les notes et clôturer les évaluations prévues dans vos séances.",
    href: "/app/formateur/seances?vue=evaluations",
    icon: ClipboardCheck,
  },
] as const

export function TrainerDashboard() {
  const assignment = useAuthStore((state) => state.context?.affectation_courante)
  const [center, setCenter] = useState<Center | null>(null)
  const [loadingCenter, setLoadingCenter] = useState(true)
  const centerId = assignment?.centre_id ?? 0

  useEffect(() => {
    let active = true

    async function loadCenter() {
      setLoadingCenter(true)
      try {
        if (!centerId) {
          if (active) setCenter(null)
          return
        }

        const data = await affectationsApi.center(centerId)
        if (active) setCenter(data)
      } catch {
        if (active) setCenter(null)
      } finally {
        if (active) setLoadingCenter(false)
      }
    }

    void loadCenter()
    return () => { active = false }
  }, [centerId])

  const stats = [
    {
      label: "Session",
      value: assignment?.session?.nom || assignment?.session?.code || "Non définie",
      icon: Clock3,
    },
    {
      label: "Centre d’intervention",
      value: loadingCenter
        ? "Chargement…"
        : center?.nom || (centerId ? `Centre n° ${centerId}` : "Non défini"),
      detail: center
        ? [center.ville, center.province].filter(Boolean).join(" — ")
        : "",
      icon: Building2,
    },
    {
      label: "Région",
      value: loadingCenter
        ? "Chargement…"
        : center?.region?.nom || assignment?.region_code || "Non définie",
      icon: MapPinned,
    },
  ]

  return <div className="space-y-5">
    <section className="rounded-2xl bg-primary px-5 py-5 text-primary-foreground shadow-lg sm:px-6">
      <Badge variant="secondary" className="mb-3">Formateur / Intervenant</Badge>
      <h1 className="text-3xl font-bold tracking-tight">Suivi de vos séances</h1>
      <p className="mt-2 max-w-4xl text-base leading-6 text-primary-foreground/85">
        Animez les séances qui vous sont confiées, enregistrez les présences et complétez les évaluations prévues.
      </p>
    </section>

    <section>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Contexte actif</p>
      <h2 className="mt-1 text-2xl font-bold">
        Votre intervention pour la session {assignment?.session?.nom || assignment?.session?.code || "courante"}
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map(({ label, value, detail, icon: Icon }) => <Card key={label}>
          <CardContent className="flex items-center gap-4 p-5">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-1 break-words text-xl font-bold leading-tight">{value}</p>
              {detail ? <p className="mt-1 text-sm text-muted-foreground">{detail}</p> : null}
            </div>
          </CardContent>
        </Card>)}
      </div>
    </section>

    <section>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Formateur / Intervenant</p>
      <h2 className="mt-1 text-2xl font-bold">Fonctionnalités du Formateur</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {modules.map(({ label, description, href, icon: Icon }) => <Link
          key={href}
          to={href}
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
        </Link>)}
      </div>
    </section>
  </div>
}
