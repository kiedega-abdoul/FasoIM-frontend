/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { BedDouble, Building2, DoorOpen, ListChecks, MapPinned } from "lucide-react"

import { getApiErrorMessage } from "@/api/api-error"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState, ErrorBox, Loading, PageHeader, PermissionGuard, StatusBadge } from "@/features/accounts/components"
import { organisationApi } from "@/features/organisation/api"
import type { Bed, Dormitory } from "@/features/organisation/types"
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
          return
        }
        const centerData = await affectationsApi.center(centerId)
        const dormitoriesData = await organisationApi.dormitories({ centre_id: centerId }).catch(() => [])
        const bedsData = await organisationApi.beds({ centre_id: centerId }).catch(() => [])
        setCenter(centerData)
        setDormitories(dormitoriesData)
        setBeds(bedsData)
      } catch (exception) {
        setError(getApiErrorMessage(exception))
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [centerId])

  const capacity = useMemo(() => dormitories.reduce((total, dormitory) => total + Number(dormitory.capacite || 0), 0), [dormitories])
  const usableBeds = useMemo(() => beds.filter((bed) => bed.est_utilisable).length, [beds])

  if (loading) return <Loading />

  return <>
    <PageHeader title="Mon centre" description="Informations et capacité d’accueil de votre centre." backTo="/app" />
    {!centerId && <EmptyState message="Cette page s’utilise avec une affectation de centre." />}
    {error && <ErrorBox message={error} />}
    {center && <div className="space-y-6">
      <Card><CardContent className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold">{center.nom}</h2>
              <StatusBadge value={center.statut.toLowerCase()} />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{center.code} · {center.ville}, {center.province}</p>
            <p className="mt-1 text-sm text-muted-foreground">{center.adresse || "Adresse non renseignée"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <PermissionGuard permission={P.UPDATE_CENTER}>
              <Button render={<Link to={`/app/centres/${center.id}/modifier`} />} variant="outline" className="rounded-xl">Modifier le centre</Button>
            </PermissionGuard>
            <Button render={<Link to="/app/organisation-centre" />} className="rounded-xl">Organisation du centre</Button>
          </div>
        </div>
      </CardContent></Card>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={MapPinned} label="Région" value={center.region?.nom || center.region?.code || "Non précisée"} />
        <StatCard icon={DoorOpen} label="Dortoirs" value={dormitories.length} />
        <StatCard icon={BedDouble} label="Lits utilisables" value={usableBeds} />
        <StatCard icon={Building2} label="Capacité déclarée" value={capacity || "Non renseignée"} />
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
