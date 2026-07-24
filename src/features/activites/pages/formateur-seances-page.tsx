import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, CalendarDays, ChevronRight, LoaderCircle, Search } from "lucide-react"
import { Link, useSearchParams } from "react-router-dom"

import { getApiErrorMessage } from "@/api/api-error"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { activitesApi } from "@/features/activites/api"
import type { Seance } from "@/features/activites/types"
import { useAuthStore } from "@/stores/auth-store"

const statusClass: Record<string, string> = {
  PLANIFIEE: "bg-blue-50 text-blue-700",
  EN_COURS: "bg-amber-50 text-amber-700",
  TERMINEE: "bg-emerald-50 text-emerald-700",
  ANNULEE: "bg-red-50 text-red-700",
  REPORTEE: "bg-slate-100 text-slate-700",
}

export function TrainerSessionsPage() {
  const [searchParams] = useSearchParams()
  const evaluationsOnly = searchParams.get("vue") === "evaluations"
  const context = useAuthStore((state) => state.context)
  const assignment = context?.affectation_courante
  const [items, setItems] = useState<Seance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        setLoading(true)
        setError("")
        const data = await activitesApi.seances({
          formateur_id: context?.acteur.id,
          session_id: assignment?.session?.id,
          centre_id: assignment?.centre_id ?? undefined,
        })
        if (active) setItems(data)
      } catch (cause) {
        if (active) setError(getApiErrorMessage(cause))
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => { active = false }
  }, [assignment?.centre_id, assignment?.session?.id, context?.acteur.id])

  const filtered = useMemo(() => {
    const source = evaluationsOnly
      ? items.filter((item) => item.type_seance === "EVALUATION")
      : items
    const value = search.trim().toLowerCase()
    if (!value) return source
    return source.filter((item) => [item.titre, item.lieu, item.module_activite?.titre, item.statut_libelle, item.statut].some((field) => String(field ?? "").toLowerCase().includes(value)))
  }, [evaluationsOnly, items, search])

  return <div className="space-y-6">
    <section className="rounded-2xl border bg-card p-6">
      <Link className={buttonVariants({ variant: "ghost", className: "mb-4 -ml-3 gap-2" })} to="/app">
        <ArrowLeft className="size-4" /> Retour au tableau de bord
      </Link>
      <Badge className="mb-3">Formateur</Badge>
      <h1 className="text-3xl font-bold">{evaluationsOnly ? "Évaluations et notes" : "Mes séances"}</h1>
      <p className="mt-2 text-muted-foreground">{evaluationsOnly
        ? "Les séances d’évaluation qui vous sont confiées sont affichées ici."
        : "Seules les séances qui vous sont affectées dans le centre courant sont affichées."}</p>
    </section>

    <div className="relative max-w-xl"><Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" /><Input className="h-12 pl-10" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={evaluationsOnly ? "Rechercher une évaluation" : "Rechercher une séance"} /></div>

    {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}
    {loading ? <LoaderCircle className="mx-auto size-8 animate-spin" /> : filtered.length === 0 ? <Card><CardContent className="p-8 text-center"><CalendarDays className="mx-auto size-10 text-muted-foreground" /><h2 className="mt-3 text-xl font-semibold">{evaluationsOnly ? "Aucune évaluation affectée" : "Aucune séance affectée"}</h2><p className="mt-2 text-muted-foreground">{evaluationsOnly ? "Les évaluations prévues apparaîtront ici." : "Les séances apparaîtront ici dès qu’un Responsable de centre vous les aura attribuées."}</p></CardContent></Card> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {filtered.map((item) => <Card key={item.id}><CardContent className="flex h-full flex-col p-5">
        <div className="flex items-start justify-between gap-3"><h2 className="text-lg font-bold">{item.titre}</h2><span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass[item.statut] ?? "bg-muted"}`}>{item.statut_libelle ?? item.statut}</span></div>
        <p className="mt-3 text-sm text-muted-foreground">{item.date_seance} · {item.heure_debut.slice(0, 5)}–{item.heure_fin.slice(0, 5)}</p>
        <p className="mt-1 text-sm">{item.lieu}</p>
        <p className="mt-1 text-sm text-muted-foreground">{item.groupe?.nom ?? item.section?.nom ?? "Tout le centre"}</p>
        <p className="mt-1 text-sm text-muted-foreground">Feuille : {item.statut_feuille_presence_libelle ?? item.statut_feuille_presence ?? "Non ouverte"}</p>
        <Link className={buttonVariants({ className: "mt-5 justify-between" })} to={`/app/formateur/seances/${item.id}`}>{item.statut === "PLANIFIEE" ? "Commencer" : item.statut === "EN_COURS" ? "Continuer" : "Consulter"} <ChevronRight className="size-4" /></Link>
      </CardContent></Card>)}
    </div>}
  </div>
}
