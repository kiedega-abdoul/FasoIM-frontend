/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { useEffect, useMemo, useRef, useState } from "react"
import { Building2, CheckCircle2, ChevronDown, Gauge, MapPinned, Play, Search, UserRoundCog, Users, XCircle } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { getApiErrorMessage } from "@/api/api-error"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState, ErrorBox, Loading, PageHeader, PermissionGuard, StatusBadge } from "@/features/accounts/components"
import { useAuthStore } from "@/stores/auth-store"
import { affectationsApi } from "../api"
import { AFFECTATION_PERMISSIONS as P } from "../permissions"
import type { AssignmentProgress, CenterAssignment, CenterCapacityReport, Region } from "../types"

const textareaClass = "min-h-28 w-full rounded-xl border bg-background p-3 text-base"
const typeOptions = [["BEPC", "BEPC"], ["BAC", "BAC"], ["CONCOURS", "Concours"], ["SELECTIONNE", "Sélectionnés"], ["VOLONTAIRE", "Volontaires"]] as const
const statusOptions = [["", "Toutes"], ["PROPOSEE", "En attente"], ["ACTIVE", "Validées"], ["REJETEE", "Rejetées"], ["ANNULEE", "Annulées"]] as const

function StatCard({ label, value, icon: Icon }: { label: string; value: number | string; icon: LucideIcon }) {
  return <Card><CardContent className="flex items-center gap-4 p-5"><span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></span><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div></CardContent></Card>
}

function displayImmerge(row: CenterAssignment) {
  return row.immerge?.code_fasoim || row.profil_source?.identifiant_source || `Immergé #${row.immerge?.id}`
}

export function CenterAssignmentsPage() {
  const assignment = useAuthStore((state) => state.context?.affectation_courante)
  const sessionId = assignment?.session?.id ?? 0
  const regionCode = assignment?.region_code ?? ""

  const [region, setRegion] = useState<Region | null>(null)
  const [report, setReport] = useState<CenterCapacityReport | null>(null)
  const [rows, setRows] = useState<CenterAssignment[]>([])
  const [selected, setSelected] = useState<number[]>([])
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("")
  const [typeImmerge, setTypeImmerge] = useState("")
  const [centreId, setCentreId] = useState("")
  const [batchSize, setBatchSize] = useState(100)
  const [manualOpen, setManualOpen] = useState(false)
  const [manualCode, setManualCode] = useState("")
  const [manualCentreId, setManualCentreId] = useState("")
  const [manualReason, setManualReason] = useState("")
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [cancelTarget, setCancelTarget] = useState<CenterAssignment | null>(null)
  const [cancelReason, setCancelReason] = useState("")
  const [taskId, setTaskId] = useState("")
  const [progress, setProgress] = useState<AssignmentProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")
  const unavailableProgressCount = useRef(0)

  async function resolveRegion() {
    const regions = await affectationsApi.regions()
    return regions.find((item) => item.code === regionCode) ?? null
  }

  async function load(options: { silent?: boolean } = {}) {
    const { silent = false } = options
    if (!silent) setLoading(true)
    setError("")
    try {
      const currentRegion = region ?? await resolveRegion()
      setRegion(currentRegion)
      if (!sessionId || !currentRegion) {
        setRows([])
        setReport(null)
        return
      }
      const [capacity, assignments] = await Promise.all([
        affectationsApi.centerCapacities(sessionId, currentRegion.id),
        affectationsApi.centerAssignments({
          session_id: sessionId,
          region_id: currentRegion.id,
        }),
      ])
      setReport(capacity)
      setRows(assignments)
      setSelected([])
      if (capacity.session.public_cible !== "MIXTE") setTypeImmerge(capacity.session.public_cible)
      if (!manualCentreId && capacity.centres.length === 1) setManualCentreId(String(capacity.centres[0].centre_id))
      if (capacity.maximum_proposable > 0 && batchSize > capacity.maximum_proposable) setBatchSize(capacity.maximum_proposable)
    } catch (exception) {
      setError(getApiErrorMessage(exception))
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => { void load() }, [assignment?.id])

  useEffect(() => {
    if (!taskId) return
    const timer = window.setInterval(async () => {
      try {
        const data = await affectationsApi.centerProgress(taskId)
        setProgress(data)
        const normalized = String(data.statut).toUpperCase()
        if (!data.operation && normalized === "EN_ATTENTE") unavailableProgressCount.current += 1
        else unavailableProgressCount.current = 0
        if (["TERMINE", "TERMINEE", "ECHEC", "ANNULEE", "REFUSEE"].includes(normalized)) {
          window.clearInterval(timer)
          setTaskId("")
          setProgress(null)
          setInfo(data.message || "Le traitement est terminé.")
          await load({ silent: true })
        } else if (unavailableProgressCount.current >= 5) {
          window.clearInterval(timer)
          setTaskId("")
          setInfo("Le suivi du traitement n’est pas encore disponible. Actualisez dans quelques instants.")
        }
      } catch {
        window.clearInterval(timer)
      }
    }, 1500)
    return () => window.clearInterval(timer)
  }, [taskId])

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase()

    return rows.filter((row) => {
      if (status && row.statut !== status) return false
      if (typeImmerge && row.immerge?.type_immerge !== typeImmerge) return false
      if (centreId && String(row.centre?.id ?? "") !== centreId) return false
      if (!value) return true

      return [
        displayImmerge(row),
        row.centre?.nom,
        row.centre?.ville,
        row.statut,
        row.motif,
      ]
        .filter(Boolean)
        .some((item) => String(item).toLowerCase().includes(value))
    })
  }, [rows, query, status, typeImmerge, centreId])

  const proposedIds = filtered.filter((row) => row.statut === "PROPOSEE").map((row) => row.id)
  const selectedProposed = selected.filter((id) => proposedIds.includes(id))
  const maxProposable = report?.maximum_proposable ?? 0
  const hasPending = (report?.propositions_en_attente_total ?? 0) > 0
  const requested = Math.max(1, Math.trunc(Number(batchSize) || 1))
  const effective = maxProposable > 0 ? Math.min(requested, maxProposable) : 0
  const quickSizes = [100, 250, 500, 1000].filter((size) => size < maxProposable)
  const availableTypes = report?.session.public_cible === "MIXTE" ? typeOptions : typeOptions.filter(([value]) => value === report?.session.public_cible)

  async function runTask(action: () => Promise<{ task_id: string }>) {
    setBusy(true); setError(""); setInfo("")
    try {
      const task = await action()
      unavailableProgressCount.current = 0
      setTaskId(task.task_id)
      setProgress(null)
      setInfo("Votre demande est encore en cours de traitement.")
    } catch (exception) { setError(getApiErrorMessage(exception)) }
    finally { setBusy(false) }
  }

  async function rejectSelected() {
    const reason = rejectReason.trim()
    if (!reason || selectedProposed.length === 0) return
    setRejectOpen(false); setRejectReason("")
    await runTask(() => affectationsApi.rejectCenterBatch({ affectation_ids: selectedProposed, motif: reason }))
  }

  async function createManual(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("")
    try {
      await affectationsApi.createCenterAssignment({ code_fasoim: manualCode.trim().toUpperCase(), centre_id: Number(manualCentreId), motif: manualReason.trim() })
      setManualCode(""); setManualReason(""); setManualOpen(false)
      setInfo("L’affectation directe au centre a été enregistrée.")
      await load({ silent: true })
    } catch (exception) { setError(getApiErrorMessage(exception)) }
    finally { setBusy(false) }
  }

  async function confirmCancel() {
    if (!cancelTarget || !cancelReason.trim()) return
    setBusy(true); setError("")
    try {
      await affectationsApi.cancelCenterAssignment(cancelTarget.id, cancelReason.trim())
      setCancelTarget(null); setCancelReason("")
      setInfo("L’affectation au centre a été annulée.")
      await load({ silent: true })
    } catch (exception) { setError(getApiErrorMessage(exception)) }
    finally { setBusy(false) }
  }

  if (loading) return <Loading />

  return <>
    <PageHeader title="Affectations aux centres" description="Répartissez les immergés validés dans votre région entre les centres d’accueil de la session." backTo="/app" />
    {error && <ErrorBox message={error} />}

    {report && <div className="space-y-6">
      <section className="rounded-2xl border bg-card p-5">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Contexte régional</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-2xl font-bold">{report.region?.nom || regionCode || "Région non renseignée"}</h2><p className="text-muted-foreground">{report.session?.nom || "Session de travail"}</p></div><p className="rounded-full bg-primary/10 px-4 py-2 font-semibold text-primary">{report.nombre_centres ?? 0} centre(s) d’accueil</p></div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Centres d’accueil" value={report.nombre_centres} icon={Building2} />
        <StatCard label="Capacité ouverte" value={report.capacite_totale} icon={Gauge} />
        <StatCard label="Immergés disponibles" value={report.candidats_disponibles} icon={Users} />
        <StatCard label="Propositions en attente" value={report.propositions_en_attente_total} icon={MapPinned} />
        <StatCard label="Affectations validées" value={report.affectations_validees_total} icon={CheckCircle2} />
        <StatCard label="Places disponibles" value={report.disponible_total} icon={Gauge} />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(report.centres ?? []).map((centre) => <Card key={centre.centre_id}><CardContent className="p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-bold">{centre.centre_nom}</h3><p className="text-sm text-muted-foreground">{centre.ville}{centre.province ? ` · ${centre.province}` : ""}</p></div><span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">{centre.disponible} place(s) libre(s)</span></div><div className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><p className="text-muted-foreground">Capacité ouverte</p><p className="font-bold">{centre.capacite_ouverte}</p></div><div><p className="text-muted-foreground">Places réservées</p><p className="font-bold">{centre.places_reservees}</p></div><div><p className="text-muted-foreground">Proposées</p><p className="font-bold">{centre.propositions_en_attente}</p></div><div><p className="text-muted-foreground">Validées</p><p className="font-bold">{centre.affectations_validees}</p></div></div></CardContent></Card>)}
      </section>

      <PermissionGuard permission={P.PROPOSE_CENTER_ASSIGNMENT}>
        <section className="rounded-2xl border bg-card p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Étape 1</p><h2 className="mt-1 text-2xl font-bold">Générer les propositions vers les centres</h2><p className="mt-1 text-muted-foreground">La capacité, le sexe et le public sont contrôlés avant qu’un centre soit proposé.</p>
          {hasPending ? <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-base font-medium text-amber-950">{report.propositions_en_attente_total} proposition(s) sont encore en attente. Validez-les ou rejetez-les avant de continuer.</div> : <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end"><div><Label>Nombre d’immergés à proposer</Label><div className="mt-2 flex flex-wrap gap-2">{quickSizes.map((size) => <Button key={size} type="button" variant={batchSize === size ? "default" : "outline"} onClick={() => setBatchSize(size)}>{size}</Button>)}{maxProposable > 0 && <Button type="button" variant={batchSize === maxProposable ? "default" : "outline"} onClick={() => setBatchSize(maxProposable)}>Tout le disponible ({maxProposable})</Button>}</div><Input className="mt-3 h-12 text-base" type="number" min={1} value={batchSize} onChange={(event) => setBatchSize(Number(event.target.value))} /></div><Button className="h-12 px-6" disabled={busy || effective <= 0 || !region} onClick={() => region && runTask(() => affectationsApi.proposeCenterBatch({ session_id: sessionId, region_id: region.id, nombre: effective }))}><Play className="mr-2 size-4" />Générer {effective} proposition(s)</Button></div>}
        </section>
      </PermissionGuard>

      {info && <div className="rounded-2xl border border-green-300 bg-green-50 px-5 py-4 text-base font-medium leading-7 text-green-900">{info}</div>}
      {progress && <section className="rounded-2xl border bg-card p-6"><div className="flex items-center justify-between"><div><h3 className="font-bold">Traitement des propositions</h3><p className="text-muted-foreground">{progress.message}</p></div><strong className="text-2xl text-primary">{progress.progression}%</strong></div><div className="mt-4 h-3 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${progress.progression}%` }} /></div></section>}

      <section className="rounded-2xl border bg-card">
        <div className="border-b p-6"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Étape 2</p><h2 className="mt-1 text-2xl font-bold">Examiner et valider les propositions</h2><p className="mt-1 text-muted-foreground">Contrôlez le centre proposé avant de valider ou rejeter la sélection.</p></div>
        <div className="space-y-4 p-5"><div className="relative"><Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" /><Input className="h-12 pl-12" placeholder="Rechercher par Code FasoIM, centre ou motif" value={query} onChange={(event) => setQuery(event.target.value)} /></div><div className="flex flex-wrap items-center gap-2"><span className="font-medium">Statut :</span>{statusOptions.map(([value, label]) => <Button key={value || "ALL"} size="sm" variant={status === value ? "default" : "outline"} onClick={() => { setStatus(value); setSelected([]) }}>{label}</Button>)}<span className="ml-3 font-medium">Public :</span>{availableTypes.map(([value, label]) => <Button key={value} size="sm" variant={typeImmerge === value ? "default" : "outline"} onClick={() => { setTypeImmerge(value); setSelected([]) }}>{label}</Button>)}<span className="ml-3 font-medium">Centre :</span><select className="h-9 rounded-xl border bg-background px-3" value={centreId} onChange={(event) => { setCentreId(event.target.value); setSelected([]) }}><option value="">Tous</option>{report.centres.map((centre) => <option key={centre.centre_id} value={centre.centre_id}>{centre.centre_nom}</option>)}</select></div></div>
        <div className="flex flex-wrap gap-2 px-5 pb-4"><PermissionGuard permission={P.VALIDATE_CENTER_ASSIGNMENT}><Button disabled={!selectedProposed.length || busy} onClick={() => runTask(() => affectationsApi.validateCenterBatch({ affectation_ids: selectedProposed }))}><CheckCircle2 className="mr-2 size-4" />Valider la sélection ({selectedProposed.length})</Button><Button variant="secondary" disabled={!proposedIds.length || busy} onClick={() => runTask(() => affectationsApi.validateCenterBatch({ affectation_ids: proposedIds }))}>Valider les propositions affichées ({proposedIds.length})</Button></PermissionGuard><PermissionGuard permission={P.UPDATE_CENTER_ASSIGNMENT}><Button variant="destructive" disabled={!selectedProposed.length || busy} onClick={() => setRejectOpen(true)}><XCircle className="mr-2 size-4" />Rejeter la sélection</Button></PermissionGuard></div>
        {filtered.length ? <div className="overflow-x-auto border-t"><Table><TableHeader><TableRow><TableHead className="w-12"><input type="checkbox" checked={proposedIds.length > 0 && selectedProposed.length === proposedIds.length} onChange={(event) => setSelected(event.target.checked ? proposedIds : [])} /></TableHead><TableHead>Immergé</TableHead><TableHead>Centre proposé</TableHead><TableHead>Origine</TableHead><TableHead>Statut</TableHead><TableHead>Justification</TableHead><TableHead /></TableRow></TableHeader><TableBody>{filtered.map((row) => <TableRow key={row.id}><TableCell><input type="checkbox" disabled={row.statut !== "PROPOSEE"} checked={selected.includes(row.id)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, row.id] : current.filter((id) => id !== row.id))} /></TableCell><TableCell><strong>{displayImmerge(row)}</strong><div className="text-sm text-muted-foreground">{row.immerge?.type_immerge}</div></TableCell><TableCell><strong>{row.centre?.nom}</strong><div className="text-sm text-muted-foreground">{row.centre?.ville}</div></TableCell><TableCell>{row.profil_source?.province_reference || "Non renseignée"}</TableCell><TableCell><StatusBadge value={row.statut} /></TableCell><TableCell className="max-w-lg text-sm text-muted-foreground">{row.motif}</TableCell><TableCell>{row.est_ouverte && <PermissionGuard permission={P.CANCEL_CENTER_ASSIGNMENT}><Button variant="outline" size="sm" onClick={() => setCancelTarget(row)}>Annuler</Button></PermissionGuard>}</TableCell></TableRow>)}</TableBody></Table></div> : <EmptyState message="Aucune affectation centre trouvée pour les filtres actuels." />}
      </section>

      <PermissionGuard permission={P.ASSIGN_CENTER}>
        <section className="rounded-2xl border bg-card p-5"><button className="flex w-full items-center justify-between text-left" onClick={() => setManualOpen((value) => !value)}><span className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><UserRoundCog className="size-5" /></span><span><strong>Affectation directe exceptionnelle</strong><span className="block text-sm text-muted-foreground">Affecter immédiatement un immergé précis à un centre compatible.</span></span></span><ChevronDown className={`size-5 transition ${manualOpen ? "rotate-180" : ""}`} /></button>{manualOpen && <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={createManual}><div><Label>Code FasoIM</Label><Input className="mt-2 h-12" value={manualCode} onChange={(event) => setManualCode(event.target.value)} required /></div><div><Label>Centre</Label><select className="mt-2 h-12 w-full rounded-xl border bg-background px-4" value={manualCentreId} onChange={(event) => setManualCentreId(event.target.value)} required><option value="">Sélectionner un centre</option>{report.centres.map((centre) => <option key={centre.centre_id} value={centre.centre_id}>{centre.centre_nom} · {centre.ville}</option>)}</select></div><div className="md:col-span-2"><Label>Motif obligatoire</Label><textarea className={`${textareaClass} mt-2`} value={manualReason} onChange={(event) => setManualReason(event.target.value)} required /></div><Button className="md:col-span-2 md:w-fit" disabled={busy}>Affecter directement au centre</Button></form>}</section>
      </PermissionGuard>
    </div>}

    <Dialog open={rejectOpen} onOpenChange={setRejectOpen}><DialogContent><DialogHeader><DialogTitle>Rejeter {selectedProposed.length} proposition(s)</DialogTitle><DialogDescription>Expliquez clairement pourquoi ces propositions ne doivent pas être retenues.</DialogDescription></DialogHeader><textarea className={textareaClass} value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} /><DialogFooter><Button variant="outline" onClick={() => setRejectOpen(false)}>Retour</Button><Button variant="destructive" disabled={!rejectReason.trim()} onClick={rejectSelected}>Confirmer le rejet</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={Boolean(cancelTarget)} onOpenChange={(open) => !open && setCancelTarget(null)}><DialogContent><DialogHeader><DialogTitle>Annuler l’affectation au centre</DialogTitle><DialogDescription>Le motif sera conservé dans l’historique.</DialogDescription></DialogHeader><textarea className={textareaClass} value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} /><DialogFooter><Button variant="outline" onClick={() => setCancelTarget(null)}>Retour</Button><Button variant="destructive" disabled={!cancelReason.trim()} onClick={confirmCancel}>Confirmer l’annulation</Button></DialogFooter></DialogContent></Dialog>
  </>
}
