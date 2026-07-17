import {
  ArrowLeft,
  BookOpenCheck,
  CalendarDays,
  Check,
  ClipboardCheck,
  LoaderCircle,
  Plus,
  Search,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import type { FormEvent } from "react"
import { useNavigate } from "react-router-dom"

import { getApiErrorMessage } from "@/api/api-error"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { activitesApi } from "@/features/activites/api"
import { accountsApi } from "@/features/accounts/api"
import { ACTIVITES_PERMISSIONS as P } from "@/features/activites/permissions"
import type { ModuleActivite, Seance } from "@/features/activites/types"
import { affectationsApi } from "@/features/affectations/api"
import { sessionsApi } from "@/features/sessions/api"
import type { ImmersionSession } from "@/features/sessions/types"
import { useAuthStore } from "@/stores/auth-store"

type View = "catalogue" | "planning"
type CentreOption = { id: number; nom: string; code: string }
type FormateurOption = { id: number; nom: string; affectationId: number }
type SessionType = "ACTIVITE" | "EVALUATION" | "CEREMONIE" | "REUNION" | "AUTRE"

const TERMINAL_STATUSES = new Set(["terminee", "archivee", "annulee"])
const ACTIVITY_CATEGORIES = [
  ["FORMATION", "Formation"], ["SENSIBILISATION", "Sensibilisation"],
  ["SPORT", "Sport"], ["CIVISME", "Civisme"], ["DISCIPLINE", "Discipline"],
  ["ORIENTATION", "Orientation"], ["CULTURE", "Culture"], ["AUTRE", "Autre"],
] as const
const SESSION_TYPES: Array<[SessionType, string, string]> = [
  ["ACTIVITE", "Activité", "Séance liée ou non au catalogue national"],
  ["EVALUATION", "Évaluation", "Séance notée avec barème et coefficient"],
  ["CEREMONIE", "Cérémonie", "Ouverture, clôture ou rassemblement officiel"],
  ["REUNION", "Réunion", "Réunion d’information ou de coordination"],
  ["AUTRE", "Autre", "Toute autre séance programmée"],
]
const EVALUATION_TYPES = [
  ["QUIZ", "Quiz"], ["TEST", "Test"], ["PRATIQUE", "Pratique"],
  ["COMPORTEMENT", "Comportement"], ["PARTICIPATION", "Participation"],
  ["FINALE", "Finale"], ["AUTRE", "Autre"],
] as const

function isOpen(session: ImmersionSession) {
  return !TERMINAL_STATUSES.has(String(session.statut).toLowerCase())
}

function ChoiceCard({ selected, title, subtitle, onClick }: { selected: boolean; title: string; subtitle?: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`min-h-24 rounded-2xl border p-4 text-left transition ${selected ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "bg-background hover:border-primary/40"}`}>
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border ${selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"}`}>
          {selected && <Check className="size-4" />}
        </span>
        <span><strong className="block text-base">{title}</strong>{subtitle && <span className="mt-1 block text-sm text-muted-foreground">{subtitle}</span>}</span>
      </div>
    </button>
  )
}

export function AdministrationActivitiesPage() {
  const navigate = useNavigate()
  const assignment = useAuthStore((state) => state.context?.affectation_courante)
  const permissions = assignment?.permissions ?? []
  const [view, setView] = useState<View>("catalogue")
  const [sessions, setSessions] = useState<ImmersionSession[]>([])
  const [centres, setCentres] = useState<CentreOption[]>([])
  const [formateurs, setFormateurs] = useState<FormateurOption[]>([])
  const [activities, setActivities] = useState<ModuleActivite[]>([])
  const [seances, setSeances] = useState<Seance[]>([])
  const [sessionId, setSessionId] = useState<number | null>(assignment?.session?.id ?? null)
  const [centreId, setCentreId] = useState<number | null>(assignment?.centre_id ?? null)
  const [sessionType, setSessionType] = useState<SessionType>("ACTIVITE")
  const [activityId, setActivityId] = useState<number | null>(null)
  const [formateurId, setFormateurId] = useState<number | null>(null)
  const [category, setCategory] = useState("CIVISME")
  const [evaluationType, setEvaluationType] = useState("TEST")
  const [showCreateActivity, setShowCreateActivity] = useState(false)
  const [showProgram, setShowProgram] = useState(false)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  const selectedSession = sessions.find((item) => item.id === sessionId) ?? null
  const allowedCentreIds = useMemo(() => new Set((selectedSession?.parametres?.centres_accueil ?? []).map((item) => item.centre_id)), [selectedSession])
  const sessionCentres = useMemo(() => allowedCentreIds.size ? centres.filter((item) => allowedCentreIds.has(item.id)) : centres, [allowedCentreIds, centres])
  const filteredActivities = useMemo(() => activities.filter((item) => `${item.titre} ${item.code} ${item.categorie_libelle ?? item.categorie}`.toLowerCase().includes(search.toLowerCase())), [activities, search])
  const filteredSeances = useMemo(() => seances.filter((item) => `${item.titre} ${item.centre.nom} ${item.type_seance ?? ""}`.toLowerCase().includes(search.toLowerCase())), [seances, search])

  async function loadBase() {
    setLoading(true); setMessage("")
    try {
      const [activityRows, sessionRows, centreRows] = await Promise.all([
        activitesApi.modules({ page_size: 1000 }), sessionsApi.sessions({ page_size: 1000 }), affectationsApi.centers({ page_size: 1000 }),
      ])
      const open = sessionRows.filter(isOpen)
      setActivities(activityRows); setSessions(open); setCentres(centreRows)
      const preferred = assignment?.session?.id && open.some((item) => item.id === assignment.session?.id) ? assignment.session.id : open[0]?.id ?? null
      setSessionId(preferred)
    } catch (error) { setMessage(getApiErrorMessage(error) || "Impossible de charger les données.") }
    finally { setLoading(false) }
  }


  async function loadFormateurs(currentSessionId: number | null, currentCentreId: number | null) {
    if (!currentSessionId || !currentCentreId) {
      setFormateurs([])
      setFormateurId(null)
      return
    }
    try {
      const assignments = await accountsApi.assignments({
        session_id: currentSessionId,
        centre_id: currentCentreId,
        page_size: 1000,
      })
      const rolesByAssignment = await Promise.all(
        assignments.map((item) => accountsApi.roleAssignments({ affectation_acteur_id: item.id }))
      )
      const rows = assignments
        .filter((_, index) => rolesByAssignment[index].some((role) => role.est_actif && role.role.code === "FORMATEUR"))
        .map((item) => ({
          id: item.acteur.id,
          nom: item.acteur.nom_complet || item.acteur.username,
          affectationId: item.id,
        }))
      setFormateurs(rows)
      setFormateurId((current) => rows.some((item) => item.id === current) ? current : null)
    } catch {
      setFormateurs([])
      setFormateurId(null)
    }
  }

  async function loadPlanning(id: number | null) {
    if (!id) { setSeances([]); return }
    try { setSeances(await activitesApi.seances({ session_id: id, page_size: 1000 })) }
    catch (error) { setMessage(getApiErrorMessage(error) || "Impossible de charger le planning.") }
  }

  useEffect(() => { void loadBase() }, [assignment?.id])
  useEffect(() => { void loadPlanning(sessionId); setCentreId(assignment?.centre_id ?? null) }, [sessionId])
  useEffect(() => { void loadFormateurs(sessionId, centreId) }, [sessionId, centreId])

  async function createActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form)
    setSaving(true); setMessage("")
    try {
      await activitesApi.createModule({
        titre: data.get("titre"), description: data.get("description"), categorie: category,
        duree_prevue: Number(data.get("duree_prevue")) || null, ordre: 0, statut: "ACTIF",
      })
      form.reset(); setShowCreateActivity(false); setActivities(await activitesApi.modules({ page_size: 1000 }))
    } catch (error) { setMessage(getApiErrorMessage(error) || "La création a échoué.") }
    finally { setSaving(false) }
  }

  async function program(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form)
    if (!sessionId || !centreId) { setMessage("Choisissez une session et un centre."); return }
    setSaving(true); setMessage("")
    const common = {
      session_id: sessionId, centre_id: centreId, titre: data.get("titre"), date_seance: data.get("date_seance"),
      heure_debut: data.get("heure_debut"), heure_fin: data.get("heure_fin"), lieu: data.get("lieu"), observations: data.get("observations"),
      module_activite_id: sessionType === "ACTIVITE" || sessionType === "EVALUATION" ? activityId : null,
      formateur_id: formateurId,
    }
    try {
      if (sessionType === "EVALUATION") {
        await activitesApi.programEvaluation({ ...common, type_evaluation: evaluationType, bareme: Number(data.get("bareme")), coefficient: Number(data.get("coefficient")) })
      } else {
        await activitesApi.createSeance({ ...common, type_seance: sessionType, statut: "PLANIFIEE" })
      }
      form.reset(); setShowProgram(false); await loadPlanning(sessionId)
    } catch (error) { setMessage(getApiErrorMessage(error) || "La programmation a échoué.") }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-6 pb-10">
      <Button variant="ghost" className="h-11 px-0 text-base" onClick={() => navigate(-1)}><ArrowLeft className="mr-2 size-5" />Retour</Button>
      <section className="rounded-3xl bg-primary px-6 py-7 text-primary-foreground shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em]">Administration</p>
        <h1 className="mt-2 text-3xl font-bold">Activités et planning des séances</h1>
        <p className="mt-2 max-w-4xl text-base text-primary-foreground/85">Les activités forment un catalogue national indépendant. Les séances sont ensuite programmées pour une session et un centre. Une évaluation est programmée directement comme une séance de type évaluation.</p>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <button onClick={() => setView("catalogue")} className={`rounded-2xl border p-5 text-left ${view === "catalogue" ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "bg-background"}`}>
          <BookOpenCheck className="size-7 text-primary" /><h2 className="mt-3 text-xl font-bold">Catalogue national des activités</h2><p className="mt-1 text-sm text-muted-foreground">Créer et gérer les activités réutilisables, sans session ni centre.</p>
        </button>
        <button onClick={() => setView("planning")} className={`rounded-2xl border p-5 text-left ${view === "planning" ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "bg-background"}`}>
          <CalendarDays className="size-7 text-primary" /><h2 className="mt-3 text-xl font-bold">Planning des séances</h2><p className="mt-1 text-sm text-muted-foreground">Choisir une session, un centre et programmer une activité, une évaluation ou un autre événement.</p>
        </button>
      </div>

      {message && <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-destructive">{message}</p>}

      {view === "catalogue" ? (
        <Card><CardContent className="space-y-5 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="text-2xl font-bold">Activités</h2><p className="text-muted-foreground">Le code est généré automatiquement par le système.</p></div>
            {permissions.includes(P.CREATE_ACTIVITY) && <Button size="lg" className="h-12 px-6 text-base" onClick={() => setShowCreateActivity(!showCreateActivity)}><Plus className="mr-2 size-5" />Nouvelle activité</Button>}
          </div>
          {showCreateActivity && <form onSubmit={createActivity} className="space-y-6 rounded-2xl border bg-muted/20 p-6">
            <div className="grid gap-5 md:grid-cols-2"><label className="space-y-2 font-medium">Titre<Input name="titre" className="h-12" required /></label><label className="space-y-2 font-medium">Durée indicative (minutes)<Input name="duree_prevue" type="number" min="1" className="h-12" /></label></div>
            <div><p className="mb-3 font-medium">Catégorie</p><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{ACTIVITY_CATEGORIES.map(([value, label]) => <ChoiceCard key={value} selected={category === value} title={label} onClick={() => setCategory(value)} />)}</div></div>
            <label className="block space-y-2 font-medium">Description<textarea name="description" className="min-h-28 w-full rounded-xl border bg-background p-3" /></label>
            <Button type="submit" size="lg" className="h-12 min-w-56 text-base" disabled={saving}>{saving ? <LoaderCircle className="mr-2 size-5 animate-spin" /> : <Plus className="mr-2 size-5" />}Créer l’activité</Button>
          </form>}
          <div className="relative max-w-xl"><Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" /><Input className="h-12 pl-10" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une activité" /></div>
          {loading ? <LoaderCircle className="mx-auto size-8 animate-spin" /> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filteredActivities.map((item) => <article key={item.id} className="rounded-2xl border p-5"><div className="flex justify-between gap-3"><h3 className="text-lg font-bold">{item.titre}</h3><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{item.categorie_libelle ?? item.categorie}</span></div><p className="mt-1 text-sm text-muted-foreground">{item.code}</p><p className="mt-4 text-sm">{item.description || "Aucune description"}</p></article>)}</div>}
        </CardContent></Card>
      ) : (
        <div className="space-y-6">
          <Card><CardContent className="space-y-5 p-6"><div><h2 className="text-2xl font-bold">1. Choisir la session</h2><p className="text-muted-foreground">Nom principal, code affiché comme référence secondaire.</p></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{sessions.map((item) => <ChoiceCard key={item.id} selected={sessionId === item.id} title={item.nom} subtitle={`${item.code} · ${item.type_session} · ${item.public_cible}`} onClick={() => setSessionId(item.id)} />)}</div></CardContent></Card>
          {sessionId && <Card><CardContent className="space-y-5 p-6"><div><h2 className="text-2xl font-bold">2. Choisir le centre</h2><p className="text-muted-foreground">Seuls les centres configurés pour la session sont proposés.</p></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{sessionCentres.map((item) => <ChoiceCard key={item.id} selected={centreId === item.id} title={item.nom} subtitle={item.code} onClick={() => setCentreId(item.id)} />)}</div></CardContent></Card>}
          {sessionId && centreId && <Card><CardContent className="space-y-5 p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-2xl font-bold">3. Programmer une séance</h2><p className="text-muted-foreground">L’évaluation est créée en une seule opération comme séance spéciale.</p></div>{permissions.includes(P.PLAN_SEANCE) && <Button size="lg" className="h-12 px-6 text-base" onClick={() => setShowProgram(!showProgram)}><Plus className="mr-2 size-5" />Programmer une séance</Button>}</div>
            {showProgram && <form onSubmit={program} className="space-y-6 rounded-2xl border bg-muted/20 p-6">
              <div><p className="mb-3 font-medium">Type de séance</p><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">{SESSION_TYPES.map(([value, title, subtitle]) => <ChoiceCard key={value} selected={sessionType === value} title={title} subtitle={subtitle} onClick={() => setSessionType(value)} />)}</div></div>
              {(sessionType === "ACTIVITE" || sessionType === "EVALUATION") && <div><p className="mb-3 font-medium">{sessionType === "EVALUATION" ? "Activité évaluée — facultative" : "Activité associée — facultative"}</p><div className="grid max-h-64 gap-3 overflow-y-auto md:grid-cols-2 xl:grid-cols-4"><ChoiceCard selected={activityId === null} title="Sans activité du catalogue" onClick={() => setActivityId(null)} />{activities.map((item) => <ChoiceCard key={item.id} selected={activityId === item.id} title={item.titre} subtitle={item.code} onClick={() => setActivityId(item.id)} />)}</div></div>}
              <div><p className="mb-3 font-medium">Formateur chargé de la séance — facultatif</p><p className="mb-3 text-sm text-muted-foreground">Seuls les acteurs ayant le rôle Formateur dans cette session et ce centre sont proposés.</p><div className="grid max-h-64 gap-3 overflow-y-auto md:grid-cols-2 xl:grid-cols-4"><ChoiceCard selected={formateurId === null} title="Aucun formateur affecté" onClick={() => setFormateurId(null)} />{formateurs.map((item) => <ChoiceCard key={item.affectationId} selected={formateurId === item.id} title={item.nom} subtitle="Formateur" onClick={() => setFormateurId(item.id)} />)}</div></div>
              <div className="grid gap-5 md:grid-cols-2"><label className="space-y-2 font-medium">Titre<Input name="titre" className="h-12" required /></label><label className="space-y-2 font-medium">Lieu<Input name="lieu" className="h-12" required /></label><label className="space-y-2 font-medium">Date<Input name="date_seance" type="date" className="h-12" min={selectedSession?.date_debut} max={selectedSession?.date_fin} required /></label><div className="grid grid-cols-2 gap-3"><label className="space-y-2 font-medium">Début<Input name="heure_debut" type="time" className="h-12" required /></label><label className="space-y-2 font-medium">Fin<Input name="heure_fin" type="time" className="h-12" required /></label></div></div>
              {sessionType === "EVALUATION" && <><div><p className="mb-3 font-medium">Type d’évaluation</p><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{EVALUATION_TYPES.map(([value, label]) => <ChoiceCard key={value} selected={evaluationType === value} title={label} onClick={() => setEvaluationType(value)} />)}</div></div><div className="grid gap-5 md:grid-cols-2"><label className="space-y-2 font-medium">Barème<Input name="bareme" type="number" min="0.01" step="0.01" className="h-12" required /></label><label className="space-y-2 font-medium">Coefficient<Input name="coefficient" type="number" min="0.01" step="0.01" defaultValue="1" className="h-12" required /></label></div></>}
              <label className="block space-y-2 font-medium">Observations<textarea name="observations" className="min-h-24 w-full rounded-xl border bg-background p-3" /></label>
              <Button type="submit" size="lg" className="h-12 min-w-64 text-base" disabled={saving}>{saving ? <LoaderCircle className="mr-2 size-5 animate-spin" /> : sessionType === "EVALUATION" ? <ClipboardCheck className="mr-2 size-5" /> : <CalendarDays className="mr-2 size-5" />}Programmer</Button>
            </form>}
            <div className="relative max-w-xl"><Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" /><Input className="h-12 pl-10" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher dans le planning" /></div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filteredSeances.map((item) => <article key={item.id} className="rounded-2xl border p-5"><div className="flex justify-between gap-3"><h3 className="text-lg font-bold">{item.titre}</h3><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{item.type_seance_libelle ?? item.type_seance ?? "Séance"}</span></div><p className="mt-2 text-sm text-muted-foreground">{item.date_seance} · {item.heure_debut}–{item.heure_fin}</p><p className="mt-1 text-sm">{item.centre.nom}</p>{item.module_activite && <p className="mt-1 text-sm text-muted-foreground">Activité : {item.module_activite.titre}</p>}{item.formateur && <p className="mt-1 text-sm text-muted-foreground">Formateur : {item.formateur.nom_complet}</p>}</article>)}</div>
          </CardContent></Card>}
        </div>
      )}
    </div>
  )
}
