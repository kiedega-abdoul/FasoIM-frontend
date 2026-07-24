/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useState } from "react"
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, ClipboardCheck, LoaderCircle, Play, RefreshCw, Save, Square, UsersRound } from "lucide-react"
import { Link, useParams } from "react-router-dom"
import { toast } from "sonner"

import { getApiErrorMessage } from "@/api/api-error"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { activitesApi } from "@/features/activites/api"
import type { Evaluation, Note, Presence, Seance, TaskLaunch } from "@/features/activites/types"

const PAGE_SIZE = 50
const pause = (duration: number) => new Promise((resolve) => window.setTimeout(resolve, duration))

export function TrainerSessionDetailPage() {
  const id = Number(useParams().id)
  const [seance, setSeance] = useState<Seance | null>(null)
  const [presences, setPresences] = useState<Presence[]>([])
  const [presenceCount, setPresenceCount] = useState(0)
  const [presencePage, setPresencePage] = useState(1)
  const [notePage, setNotePage] = useState(1)
  const [confirmedPages, setConfirmedPages] = useState<Set<number>>(new Set())
  const [presenceSelection, setPresenceSelection] = useState<Record<number, boolean>>({})
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [notePresences, setNotePresences] = useState<Presence[]>([])
  const [noteCount, setNoteCount] = useState(0)
  const [defaultNote, setDefaultNote] = useState("15")
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [preparing, setPreparing] = useState(false)
  const [error, setError] = useState("")

  const totalPresencePages = Math.max(1, Math.ceil(presenceCount / PAGE_SIZE))
  const totalNotePages = Math.max(1, Math.ceil((noteCount || presenceCount) / PAGE_SIZE))

  const load = useCallback(async (requestedPresencePage = presencePage, requestedNotePage = notePage) => {
    if (!Number.isFinite(id)) return
    try {
      setLoading(true)
      setError("")
      const current = await activitesApi.seance(id)
      setSeance(current)
      const [presencePage, evaluations] = await Promise.all([
        activitesApi.presences(id, requestedPresencePage),
        activitesApi.evaluations({ seance_id: id }),
      ])
      setPresences(presencePage.results)
      setPresenceCount(presencePage.count)
      setPresenceSelection(Object.fromEntries(
        presencePage.results.map((item) => [
          item.affectation_centre.id,
          item.statut_presence === "PRESENT" || item.statut_presence === "RETARD",
        ]),
      ))
      const currentEvaluation = evaluations[0] ?? null
      setEvaluation(currentEvaluation)

      if (currentEvaluation) {
        const [notePresencePage, notePageResult] = await Promise.all([
          activitesApi.presences(id, requestedNotePage),
          activitesApi.notes(currentEvaluation.id, requestedNotePage),
        ])
        setNotePresences(notePresencePage.results)
        setNotes(notePageResult.results)
        setNoteCount(notePageResult.count)
      } else {
        setNotePresences([])
        setNotes([])
        setNoteCount(0)
      }
    } catch (cause) {
      setError(getApiErrorMessage(cause))
    } finally {
      setLoading(false)
    }
  }, [id, notePage, presencePage])

  useEffect(() => { void load(presencePage, notePage) }, [load, notePage, presencePage])

  const attendreTache = async (task: TaskLaunch) => {
    for (let attempt = 0; attempt < 90; attempt += 1) {
      const progression = await activitesApi.operation(task.task_id)
      if (progression.statut === "TERMINEE") return progression
      if (progression.statut === "ECHEC" || progression.statut === "REFUSEE") {
        throw new Error(progression.message || "L’opération a échoué.")
      }
      await pause(700)
    }
    throw new Error("L’opération prend trop de temps. Réessayez dans quelques instants.")
  }

  const run = async (action: () => Promise<unknown>, success: string) => {
    try {
      setWorking(true)
      await action()
      toast.success(success)
      await load(presencePage, notePage)
    } catch (cause) {
      toast.error(getApiErrorMessage(cause))
    } finally {
      setWorking(false)
    }
  }

  const preparerListe = async () => {
    if (!seance) return
    try {
      setPreparing(true)
      const task = await activitesApi.preparerFeuille(seance.id)
      await attendreTache(task)
      setPresencePage(1)
      setNotePage(1)
      setConfirmedPages(new Set())
      await load(1)
      toast.success("La liste des immergés est prête. Tous sont présents par défaut.")
    } catch (cause) {
      toast.error(getApiErrorMessage(cause))
    } finally {
      setPreparing(false)
    }
  }

  const commencer = async () => {
    if (!seance) return
    try {
      setWorking(true)
      await activitesApi.demarrerSeance(seance.id)
      await preparerListe()
    } catch (cause) {
      toast.error(getApiErrorMessage(cause))
    } finally {
      setWorking(false)
    }
  }

  const confirmerPage = async () => {
    if (!seance || presences.length === 0) return
    const lignes = presences.map((presence) => ({
      affectation_centre_id: presence.affectation_centre.id,
      statut_presence: presenceSelection[presence.affectation_centre.id] ? "PRESENT" : "ABSENT",
      heure_arrivee: null,
      observations: "",
    }))

    try {
      setWorking(true)
      const task = await activitesApi.saisirPresences(seance.id, lignes)
      await attendreTache(task)
      setConfirmedPages((current) => new Set(current).add(presencePage))
      await load(presencePage, notePage)
      toast.success(`Présences de la page ${presencePage} confirmées.`)
    } catch (cause) {
      toast.error(getApiErrorMessage(cause))
    } finally {
      setWorking(false)
    }
  }

  const confirmerTousPresents = async () => {
    if (!seance) return
    try {
      setWorking(true)
      await activitesApi.confirmerTousPresents(seance.id)
      setConfirmedPages(new Set(Array.from({ length: totalPresencePages }, (_, index) => index + 1)))
      await load(presencePage, notePage)
      toast.success("Tous les participants ont été confirmés présents et la feuille a été validée.")
    } catch (cause) {
      toast.error(getApiErrorMessage(cause))
    } finally {
      setWorking(false)
    }
  }

  const noterTous = async () => {
    if (!evaluation) return
    try {
      setWorking(true)
      const resultat = await activitesApi.noterTous(evaluation.id, Number(defaultNote))
      await load(presencePage, notePage)
      toast.success(`${resultat.notes_creees} note(s) ajoutée(s). Les notes déjà saisies ont été conservées.`)
    } catch (cause) {
      toast.error(getApiErrorMessage(cause))
    } finally {
      setWorking(false)
    }
  }

  const goNext = () => {
    if (!confirmedPages.has(presencePage)) {
      toast.error("Confirmez les présences de cette page avant de continuer.")
      return
    }
    setPresencePage((current) => Math.min(totalPresencePages, current + 1))
  }

  const noteByAffectation = useMemo(() => new Map(notes.map((item) => [item.affectation_centre.id, item])), [notes])
  const totalPresentsPage = useMemo(
    () => presences.filter((presence) => presenceSelection[presence.affectation_centre.id]).length,
    [presences, presenceSelection],
  )
  const allPagesConfirmed = confirmedPages.size >= totalPresencePages

  if (loading && !seance) return <LoaderCircle className="mx-auto mt-20 size-9 animate-spin" />
  if (!seance) return <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">{error || "Séance introuvable."}</div>

  const feuilleOuverte = seance.statut_feuille_presence === "OUVERTE"

  return <div className="space-y-6">
    <Link className={buttonVariants({ variant: "ghost" })} to="/app/formateur/seances"><ArrowLeft className="mr-2 size-4" />Retour à mes séances</Link>

    <section className="rounded-2xl bg-primary p-6 text-primary-foreground">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div><Badge variant="secondary">{seance.type_seance_libelle ?? "Séance"}</Badge><h1 className="mt-3 text-3xl font-bold">{seance.titre}</h1><p className="mt-2 text-primary-foreground/80">{seance.date_seance} · {seance.heure_debut.slice(0, 5)}–{seance.heure_fin.slice(0, 5)} · {seance.lieu}</p></div>
        <div className="flex flex-wrap gap-2">
          {seance.statut === "PLANIFIEE" && <Button variant="secondary" disabled={working || preparing} onClick={() => void commencer()}><Play className="mr-2 size-4" />Commencer</Button>}
          {seance.statut === "EN_COURS" && <Button variant="secondary" disabled={working || preparing || (presenceCount > 0 && seance.statut_feuille_presence !== "CLOTUREE")} onClick={() => void run(() => activitesApi.terminerSeance(seance.id), "La séance est terminée.")}><Square className="mr-2 size-4" />Terminer</Button>}
          <Button variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white" onClick={() => void load(presencePage, notePage)}><RefreshCw className="mr-2 size-4" />Actualiser</Button>
        </div>
      </div>
    </section>

    {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">État de la séance</p><p className="mt-1 text-lg font-semibold">{seance.statut_libelle ?? seance.statut}</p></CardContent></Card>
      <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Feuille de présence</p><p className="mt-1 text-lg font-semibold">{seance.statut_feuille_presence_libelle ?? seance.statut_feuille_presence}</p></CardContent></Card>
      <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Participants</p><p className="mt-1 text-lg font-semibold">{presenceCount}</p><p className="text-xs text-muted-foreground">{totalPresentsPage} présents sur cette page</p></CardContent></Card>
      <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Cible</p><p className="mt-1 text-lg font-semibold">{seance.groupe?.nom ?? seance.section?.nom ?? "Centre"}</p></CardContent></Card>
    </section>

    {seance.statut !== "PLANIFIEE" && seance.statut_feuille_presence !== "CLOTUREE" && <Card><CardContent className="space-y-5 p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold"><UsersRound className="size-6" />Présences des immergés</h2>
          <p className="text-muted-foreground">50 immergés maximum par page. Tous sont présents par défaut : décochez uniquement les absents, puis confirmez la page.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {seance.statut_feuille_presence === "NON_OUVERTE" && <Button disabled={working || preparing} onClick={() => void preparerListe()}>{preparing ? <LoaderCircle className="mr-2 size-4 animate-spin" /> : null}{preparing ? "Préparation…" : "Afficher les immergés"}</Button>}
          {feuilleOuverte && presences.length > 0 && <>
            <Button variant="outline" disabled={working} onClick={() => setPresenceSelection(Object.fromEntries(presences.map((item) => [item.affectation_centre.id, true])))}>Tous présents</Button>
            <Button variant="outline" disabled={working} onClick={() => setPresenceSelection(Object.fromEntries(presences.map((item) => [item.affectation_centre.id, false])))}>Tous absents</Button>
            <Button disabled={working} onClick={() => void confirmerPage()}><Save className="mr-2 size-4" />{confirmedPages.has(presencePage) ? "Reconfirmer cette page" : "Confirmer cette page"}</Button>
            <Button variant="secondary" disabled={working} onClick={() => void confirmerTousPresents()}>Confirmer tous présents</Button>
          </>}
          {seance.statut_feuille_presence === "OUVERTE" && <Button variant="secondary" disabled={working || presenceCount === 0 || !allPagesConfirmed} onClick={() => void run(() => activitesApi.validerFeuille(seance.id), "La feuille de présence est validée.")}>Valider toute la feuille</Button>}
          {seance.statut_feuille_presence === "VALIDEE" && <Button disabled={working} onClick={() => void run(() => activitesApi.cloturerFeuille(seance.id), "La feuille de présence est clôturée.")}>Clôturer la feuille</Button>}
        </div>
      </div>

      {preparing ? <div className="flex items-center justify-center gap-3 rounded-xl border border-dashed p-10 text-muted-foreground"><LoaderCircle className="size-5 animate-spin" />Préparation de la liste des immergés…</div> : presences.length === 0 ? <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">La liste des immergés n’est pas encore disponible.</div> : <>
        <div className="overflow-hidden rounded-xl border">
          <div className="grid grid-cols-[72px_1fr_140px] gap-3 border-b bg-muted/40 px-4 py-3 text-sm font-semibold">
            <span>Présent</span><span>Immergé</span><span>Situation</span>
          </div>
          {presences.map((presence) => {
            const present = Boolean(presenceSelection[presence.affectation_centre.id])
            return <label key={presence.id} className="grid cursor-pointer grid-cols-[72px_1fr_140px] items-center gap-3 border-b px-4 py-4 last:border-b-0 hover:bg-muted/30">
              <span className="flex justify-center"><input type="checkbox" className="size-5 accent-primary" checked={present} disabled={!feuilleOuverte || working} onChange={(event) => setPresenceSelection((current) => ({ ...current, [presence.affectation_centre.id]: event.target.checked }))} /></span>
              <span><span className="block font-semibold">{presence.affectation_centre.immerge.code_fasoim}</span><span className="block text-sm text-muted-foreground">{presence.affectation_centre.immerge.type_immerge || "Immergé"}</span></span>
              <Badge variant={present ? "default" : "destructive"} className="justify-center">{present ? "Présent" : "Absent"}</Badge>
            </label>
          })}
        </div>

        <div className="flex flex-col gap-3 rounded-xl border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium">Page {presencePage} sur {totalPresencePages} · {presences.length} immergés</p>
          <div className="flex gap-2">
            <Button variant="outline" disabled={working || presencePage === 1} onClick={() => setPresencePage((current) => Math.max(1, current - 1))}><ChevronLeft className="mr-2 size-4" />Précédente</Button>
            <Button disabled={working || presencePage >= totalPresencePages || !confirmedPages.has(presencePage)} onClick={goNext}>Suivante<ChevronRight className="ml-2 size-4" /></Button>
          </div>
        </div>
      </>}
    </CardContent></Card>}

    {evaluation && <Card><CardContent className="space-y-5 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="flex items-center gap-2 text-2xl font-bold"><ClipboardCheck className="size-6" />{evaluation.titre}</h2><p className="text-muted-foreground">Barème : {evaluation.bareme} · État : {evaluation.statut_libelle ?? evaluation.statut}</p></div><div className="flex gap-2">
        {evaluation.statut === "BROUILLON" && <Button disabled={
  working ||
  !["VALIDEE", "CLOTUREE"].includes(
    seance.statut_feuille_presence ?? "",
  )
} onClick={() => void run(() => activitesApi.ouvrirEvaluation(evaluation.id), "La saisie des notes est ouverte.")}>Ouvrir la saisie</Button>}
        {evaluation.statut === "OUVERTE" && <>
          <Select value={defaultNote} onValueChange={(value) => value && setDefaultNote(value)}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[15, 16, 17, 18].map((note) => <SelectItem key={note} value={String(note)}>{note} / {evaluation.bareme}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="secondary" disabled={working} onClick={() => void noterTous()}>Noter tous</Button>
          <Button disabled={working} onClick={() => void run(() => activitesApi.cloturerEvaluation(evaluation.id), "L’évaluation est clôturée.")}><CheckCircle2 className="mr-2 size-4" />Clôturer</Button>
        </>}
      </div></div>

      {notePresences.length === 0 ? <p className="text-muted-foreground">Aucun participant présent n’est disponible pour cette évaluation.</p> : <>
        <div className="space-y-3">{notePresences.map((presence) => {
          const existing = noteByAffectation.get(presence.affectation_centre.id)
          return <NoteRow key={`${presence.id}-${existing?.id ?? "nouvelle"}-${existing?.valeur ?? ""}`} disabled={evaluation.statut !== "OUVERTE" || working} code={presence.affectation_centre.immerge.code_fasoim} bareme={Number(evaluation.bareme)} existing={existing} onSave={(value, statut) => run(() => activitesApi.saisirNote({ evaluation_id: evaluation.id, affectation_centre_id: presence.affectation_centre.id, valeur: statut === "NOTEE" ? value : null, statut_note: statut, appreciation: existing?.appreciation || "", observations: existing?.observations || "" }), "Note enregistrée.")} />
        })}</div>
        <div className="flex flex-col gap-3 rounded-xl border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium">Page {notePage} sur {totalNotePages} · {notePresences.length} immergés</p>
          <div className="flex gap-2">
            <Button variant="outline" disabled={working || notePage === 1} onClick={() => setNotePage((current) => Math.max(1, current - 1))}><ChevronLeft className="mr-2 size-4" />Précédente</Button>
            <Button disabled={working || notePage >= totalNotePages} onClick={() => setNotePage((current) => Math.min(totalNotePages, current + 1))}>Suivante<ChevronRight className="ml-2 size-4" /></Button>
          </div>
        </div>
      </>}
    </CardContent></Card>}
  </div>
}

function NoteRow({ code, bareme, existing, disabled, onSave }: { code: string; bareme: number; existing?: Note; disabled: boolean; onSave: (value: number | null, statut: string) => Promise<void> }) {
  const [statut, setStatut] = useState(existing?.statut_note ?? "NOTEE")
  const [value, setValue] = useState(existing?.valeur == null ? "" : String(existing.valeur))
  return <div className="grid gap-3 rounded-xl border p-4 md:grid-cols-[1fr_180px_160px_120px] md:items-center">
    <div><p className="font-semibold">{code}</p><p className="text-sm text-muted-foreground">Barème : {bareme}</p></div>
    <Select disabled={disabled} value={statut} onValueChange={(next) => next && setStatut(next)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="NOTEE">Noté</SelectItem><SelectItem value="ABSENT">Absent</SelectItem><SelectItem value="DISPENSE">Dispensé</SelectItem></SelectContent></Select>
    <Input disabled={disabled || statut !== "NOTEE"} type="number" min="0" max={bareme} step="0.01" value={value} onChange={(event) => setValue(event.target.value)} placeholder="Note" />
    <Button disabled={disabled || (statut === "NOTEE" && value === "")} onClick={() => void onSave(statut === "NOTEE" ? Number(value) : null, statut)}>Enregistrer</Button>
  </div>
}
