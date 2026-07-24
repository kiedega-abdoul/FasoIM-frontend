import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowRight, BedDouble, Building2, DoorOpen, ListChecks, MapPinned } from "lucide-react"

import { getApiErrorMessage } from "@/api/api-error"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState, ErrorBox, Loading, PageHeader, PermissionGuard, StatusBadge } from "@/features/accounts/components"
import { organisationApi } from "@/features/organisation/api"
import type { Bed, CenterOrganizationRule, Dormitory } from "@/features/organisation/types"
import { currentCenterId } from "../scope"
import { affectationsApi } from "../api"
import { AFFECTATION_PERMISSIONS as P } from "../permissions"
import type { Center } from "../types"

function StatCard({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: string | number }) {
  return <Card><CardContent className="flex items-center gap-4 p-5">
    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></span>
    <div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold">{value}</p></div>
  </CardContent></Card>
}

export function MyCenterPage() {
  const [center, setCenter] = useState<Center | null>(null)
  const [dormitories, setDormitories] = useState<Dormitory[]>([])
  const [beds, setBeds] = useState<Bed[]>([])
  const [organizationRule, setOrganizationRule] = useState<CenterOrganizationRule | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const centerId = currentCenterId()

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError("")
      try {
        if (!centerId) {
          setCenter(null)
          setDormitories([])
          setBeds([])
          setOrganizationRule(null)
          return
        }
        const centerData = await affectationsApi.center(centerId)
        const dormitoriesData = await organisationApi.dormitories({ centre_id: centerId }).catch(() => [])
        const bedsData = await organisationApi.beds({ centre_id: centerId }).catch(() => [])
        const rulesData = await organisationApi.centerRules({ centre_id: centerId }).catch(() => [])
        setCenter(centerData)
        setDormitories(dormitoriesData)
        setBeds(bedsData)
        setOrganizationRule(rulesData[0] ?? null)
      } catch (exception) {
        setError(getApiErrorMessage(exception))
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [centerId])

  const usableBeds = useMemo(() => beds.filter((bed) => bed.est_utilisable).length, [beds])

  if (loading) return <Loading />

  return <>
    <PageHeader title="Mon centre" description="Informations et capacité d’accueil de votre centre." backTo="/app" />
    {!centerId && <EmptyState message="Cette opération nécessite une affectation active à un centre." />}
    {error && <ErrorBox message={error} />}
    {center && <div className="space-y-6">
      <Card className="overflow-hidden border-primary/15 shadow-sm"><CardContent className="p-0">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 lg:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm"><Building2 className="size-7" /></span>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-bold tracking-tight lg:text-3xl">{center.nom}</h2>
                  <StatusBadge value={center.statut.toLowerCase()} />
                </div>
                <p className="mt-2 font-medium text-foreground/80">{center.ville}, {center.province}</p>
                <p className="mt-1 text-sm text-muted-foreground">{center.adresse || "Adresse non renseignée"}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <PermissionGuard permission={P.UPDATE_CENTER}>
                <Button render={<Link to={`/app/centres/${center.id}/modifier`} />} variant="outline" size="lg" className="rounded-full px-5">Modifier le centre</Button>
              </PermissionGuard>
              <Button render={<Link to="/app/organisation-centre" />} size="lg" className="rounded-full px-5 shadow-sm">
                Organisation du centre <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent></Card>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={MapPinned} label="Région" value={center.region?.nom || center.region?.code || "Non précisée"} />
        <StatCard icon={DoorOpen} label="Dortoirs" value={dormitories.length} />
        <StatCard icon={BedDouble} label="Lits utilisables" value={usableBeds} />
        <StatCard icon={Building2} label="Places ouvertes" value={organizationRule?.capacite_ouverte ?? "Non configurées"} />
      </section>

      <Card><CardContent className="grid gap-5 p-6 sm:grid-cols-2 lg:grid-cols-3">
        <div><p className="text-sm text-muted-foreground">Accueil</p><p className="mt-1 font-semibold">{center.genre}</p></div>
        <div><p className="text-sm text-muted-foreground">Publics acceptés</p><p className="mt-1 font-semibold">{(center.publics_acceptes || []).join(", ") || "Tous publics"}</p></div>
        <div><p className="text-sm text-muted-foreground">Niveaux acceptés</p><p className="mt-1 font-semibold">{(center.niveaux_acceptes || []).join(", ") || "Non précisé"}</p></div>
      </CardContent></Card>

      <section>
        <h2 className="text-2xl font-bold">Accès du centre</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Link to="/app/organisation-centre" className="group rounded-2xl border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><ListChecks className="size-5" /></span>
            <h3 className="mt-3 font-semibold">Organisation du centre</h3>
            <p className="mt-1 text-sm text-muted-foreground">Capacité, sections, groupes et consignes.</p>
          </Link>
          <Link to="/app/dortoirs" className="group rounded-2xl border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><DoorOpen className="size-5" /></span>
            <h3 className="mt-3 font-semibold">Dortoirs</h3>
            <p className="mt-1 text-sm text-muted-foreground">Espaces d’hébergement du centre.</p>
          </Link>
          <Link to="/app/lits" className="group rounded-2xl border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><BedDouble className="size-5" /></span>
            <h3 className="mt-3 font-semibold">Lits</h3>
            <p className="mt-1 text-sm text-muted-foreground">Disponibilité des lits du centre.</p>
          </Link>
        </div>
      </section>
    </div>}
  </>
}
