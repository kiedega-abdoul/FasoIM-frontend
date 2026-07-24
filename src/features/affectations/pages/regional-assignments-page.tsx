/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { useEffect, useMemo, useRef, useState } from "react"
import {
  Building2,
  CheckCircle2,
  ChevronDown,
  Gauge,
  MapPinned,
  Play,
  Search,
  Sparkles,
  UserRoundCog,
  Users,
  XCircle,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { getApiErrorMessage } from "@/api/api-error"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState, ErrorBox, Loading, PageHeader, PermissionGuard, StatusBadge } from "@/features/accounts/components"
import { useAuthStore } from "@/stores/auth-store"
import { affectationsApi } from "../api"
import { AFFECTATION_PERMISSIONS as P } from "../permissions"
import { currentScopeParams } from "../scope"
import type { AssignmentProgress, Region, RegionalAssignment, RegionalCapacityReport } from "../types"

const selectClass = "h-12 w-full rounded-xl border bg-background px-4 text-base"
const textareaClass = "min-h-24 w-full rounded-xl border bg-background p-3 text-base"
const typeOptions = [["BEPC", "BEPC"], ["BAC", "BAC"], ["CONCOURS", "Concours"], ["SELECTIONNE", "Sélectionnés"], ["VOLONTAIRE", "Volontaires"]] as const
const statusOptions = [["", "Toutes"], ["PROPOSEE", "En attente"], ["ACTIVE", "Validées"], ["REJETEE", "Rejetées"], ["ANNULEE", "Annulées"]] as const

function currentSessionId() {
  return useAuthStore.getState().context?.affectation_courante?.session?.id ?? 0
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>
}

function displayImmerge(row: RegionalAssignment) {
  const source = row.profil_source
  return row.immerge?.code_fasoim || source?.identifiant_source || `Immergé #${row.immerge?.id}`
}

function displayType(row: RegionalAssignment) {
  return row.profil_source?.type_immerge || row.immerge?.type_immerge || "Non précisé"
}

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: LucideIcon }) {
  return <Card><CardContent className="flex items-center gap-4 p-5"><span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></span><div><p className="text-sm text-muted-foreground">{label}</p><p className="text-2xl font-bold">{value}</p></div></CardContent></Card>
}

export function RegionalAssignmentsPage() {
  const [rows, setRows] = useState<RegionalAssignment[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [capacityReport, setCapacityReport] = useState<RegionalCapacityReport | null>(null)
  const [selectedSessionId] = useState(String(currentSessionId() || ""))
  const [selected, setSelected] = useState<number[]>([])
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("PROPOSEE")
  const [typeImmerge, setTypeImmerge] = useState("")
  const [regionId, setRegionId] = useState("")
  const [batchSize, setBatchSize] = useState(100)
  const [manualCodeFasoim, setManualCodeFasoim] = useState("")
  const [manualRegionId, setManualRegionId] = useState("")
  const [motif, setMotif] = useState("")
  const [showManual, setShowManual] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [cancelTarget, setCancelTarget] = useState<RegionalAssignment | null>(null)
  const [cancelReason, setCancelReason] = useState("")
  const [taskId, setTaskId] = useState("")
  const [activeTaskKind, setActiveTaskKind] = useState<"generation" | "validation" | "rejection" | "">("")
  const [progress, setProgress] = useState<AssignmentProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")
  const unavailableProgressCount = useRef(0)
  const sessionId = Number(selectedSessionId || currentSessionId() || 0)
  const [forceAvailablePlaces, setForceAvailablePlaces] = useState(false)

  async function load(overrides?: { status?: string; typeImmerge?: string }) {
    setLoading(true)
    setError("")
    try {
      const scope = currentScopeParams() as Record<string, string | number | undefined>
      const assignmentsData = sessionId
        ? await affectationsApi.regionalAssignments({
            ...scope,
            session_id: sessionId,
            region_id: regionId ? Number(regionId) : undefined,
            statut: (overrides?.status ?? status) || undefined,
            type_immerge: (overrides?.typeImmerge ?? typeImmerge) || undefined,
          })
        : []
      setRows(assignmentsData)
      setSelected([])

      if (sessionId) {
        try {
          const report = await affectationsApi.regionalCapacities(sessionId)
          setCapacityReport(report)
          if (report.session.public_cible !== "MIXTE") {
            setTypeImmerge(report.session.public_cible)
          }
          const admissibleRegions = report.regions.map((region) => ({
            id: region.region_id,
            code: region.region_code,
            nom: region.region_nom,
            statut: "ACTIVE",
          }))
          setRegions(admissibleRegions)
          if (!manualRegionId && admissibleRegions.length === 1) setManualRegionId(String(admissibleRegions[0].id))
          if (report.maximum_proposable > 0 && batchSize > report.maximum_proposable) {
            setBatchSize(report.maximum_proposable)
          }
        } catch {
          setCapacityReport(null)
          setRegions([])
        }
      } else {
        setCapacityReport(null)
        setRegions([])
      }
    } catch (exception) {
      setError(getApiErrorMessage(exception))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  useEffect(() => {
    if (!taskId) return
    const timer = window.setInterval(async () => {
      try {
        const data = await affectationsApi.regionalProgress(taskId)
        setProgress(data)
        const normalizedStatus = String(data.statut).toUpperCase()
        const progressUnavailable = !data.operation && normalizedStatus === "EN_ATTENTE"
        if (progressUnavailable) unavailableProgressCount.current += 1
        else unavailableProgressCount.current = 0
        if (["TERMINE", "TERMINEE", "ECHEC", "ANNULEE", "REFUSEE"].includes(normalizedStatus)) {
          window.clearInterval(timer)
          setTaskId("")
          setActiveTaskKind("")
          setProgress(null)
          setInfo(data.message || (["TERMINE", "TERMINEE"].includes(normalizedStatus) ? "Traitement terminé avec succès." : "Le traitement est terminé."))
          await load()
          return
        }
        if (unavailableProgressCount.current >= 5) {
          window.clearInterval(timer)
          setTaskId("")
          setActiveTaskKind("")
          setInfo("Le suivi du traitement n’est pas encore disponible. Actualisez la liste dans quelques instants.")
        }
      } catch {
        window.clearInterval(timer)
      }
    }, 1500)
    return () => window.clearInterval(timer)
  }, [taskId])

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase()
    if (!value) return rows
    return rows.filter((row) => [displayImmerge(row), displayType(row), row.region?.nom, row.statut, row.motif].filter(Boolean).some((item) => String(item).toLowerCase().includes(value)))
  }, [rows, query])

  const proposedIds = filtered.filter((row) => row.statut === "PROPOSEE").map((row) => row.id)
  const selectedProposed = selected.filter((id) => proposedIds.includes(id))
  const maxProposable = capacityReport?.maximum_proposable ?? 0
  const hasPendingProposals = (capacityReport?.propositions_en_attente_total ?? 0) > 0
  const sessionPublic = capacityReport?.session.public_cible ?? "MIXTE"
  const availableTypeOptions = sessionPublic === "MIXTE"
    ? typeOptions
    : typeOptions.filter(([value]) => value === sessionPublic)
  const requestedBatchSize = Number.isFinite(batchSize) ? Math.max(1, Math.trunc(batchSize)) : 1
  const effectiveBatchSize = maxProposable > 0 ? Math.min(requestedBatchSize, maxProposable) : 0
  const quickSizes = [100, 250, 500, 1000].filter((size) => size < maxProposable)

  function toggle(id: number, checked: boolean) {
    setSelected((current) => checked ? [...current, id] : current.filter((item) => item !== id))
  }

  function toggleAll(checked: boolean) {
    setSelected(checked ? proposedIds : [])
  }

  async function runTask(
    action: () => Promise<{ task_id: string; message: string }>,
    kind: "generation" | "validation" | "rejection",
  ) {
    setBusy(true)
    setError("")
    setInfo("")
    try {
      const task = await action()
      unavailableProgressCount.current = 0
      setActiveTaskKind(kind)
      setTaskId(task.task_id)
      setProgress(null)
    } catch (exception) {
      setActiveTaskKind("")
      setError(getApiErrorMessage(exception))
    } finally {
      setBusy(false)
    }
  }

  async function createManual(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError("")
    try {
      await affectationsApi.createRegionalAssignment({ code_fasoim: manualCodeFasoim.trim().toUpperCase(), region_id: Number(manualRegionId), motif })
      setManualCodeFasoim("")
      setMotif("")
      setInfo("L’affectation régionale directe a été enregistrée.")
      await load()
    } catch (exception) {
      setError(getApiErrorMessage(exception))
    } finally {
      setBusy(false)
    }
  }

  async function confirmCancel() {
    if (!cancelTarget || !cancelReason.trim()) return
    setBusy(true)
    setError("")
    try {
      await affectationsApi.cancelRegionalAssignment(cancelTarget.id, cancelReason.trim())
      setCancelTarget(null)
      setCancelReason("")
      setInfo("L’affectation régionale a été annulée.")
      await load()
    } catch (exception) {
      setError(getApiErrorMessage(exception))
    } finally {
      setBusy(false)
    }
  }

  async function rejectSelected() {
    const reason = rejectReason.trim()
    if (!reason || selectedProposed.length === 0) return
    setRejectOpen(false)
    setRejectReason("")
    await runTask(() => affectationsApi.rejectRegionalBatch({ affectation_ids: selectedProposed, motif: reason }), "rejection")
  }

  return <>
    <PageHeader title="Affectations régionales" description="Préparez les propositions, contrôlez-les, puis validez les affectations de la session." backTo="/app" />

    {capacityReport && <section className="mb-6 space-y-4">
      <div className="rounded-2xl border bg-card p-5">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Session de travail</p>
        <h2 className="mt-1 text-2xl font-bold">{capacityReport.session.nom}</h2>
        <p className="text-sm text-muted-foreground">{capacityReport.session.code}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Capacité ouverte" value={capacityReport.capacite_totale} icon={Gauge} />
        <StatCard label="Propositions en attente" value={capacityReport.propositions_en_attente_total} icon={Building2} />
        <StatCard label="Affectations validées" value={capacityReport.affectations_validees_total} icon={CheckCircle2} />
        <StatCard label="Places encore proposables" value={capacityReport.disponible_total} icon={Gauge} />
        <StatCard label="Régions d’accueil" value={capacityReport.regions.length} icon={MapPinned} />
      </div>
      <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {capacityReport.regions.map((region) => <Card key={region.region_id} className={regionId === String(region.region_id) ? "border-primary ring-1 ring-primary/20" : ""}><CardContent className="p-5"><button type="button" className="w-full text-left" onClick={() => setRegionId((current) => current === String(region.region_id) ? "" : String(region.region_id))}><div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-semibold">{region.region_nom}</h3><p className="text-sm text-muted-foreground">{region.nombre_centres} centre(s) d’accueil</p></div><span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">{region.disponible} place(s) disponible(s)</span></div><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl border bg-muted/20 p-3"><p className="text-xs uppercase tracking-wide text-muted-foreground">Capacité régionale</p><p className="mt-1 text-xl font-bold">{region.capacite_ouverte}</p></div><div className="rounded-xl border bg-muted/20 p-3"><p className="text-xs uppercase tracking-wide text-muted-foreground">Places réservées</p><p className="mt-1 text-xl font-bold">{region.places_reservees}</p></div></div></button></CardContent></Card>)}
      </div>
    </section>}

    <PermissionGuard permission={P.PROPOSE_REGIONAL_ASSIGNMENT}>
      <Card className="mb-6 overflow-hidden border-primary/20">
        <CardContent className="p-0">
          <div className="border-b bg-primary/[0.04] p-6">
            <div className="flex items-start gap-4"><span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><Sparkles className="size-6" /></span><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Étape 1</p><h2 className="mt-1 text-xl font-bold">Générer des propositions régionales</h2><p className="mt-1 text-sm text-muted-foreground">Choisissez le nombre d’immergés à traiter. Le nombre retenu ne dépassera ni les candidats disponibles ni les places encore ouvertes.</p></div></div>
          </div>
          <div className="space-y-5 p-6">
            {hasPendingProposals && <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900"><p className="font-semibold">De nouvelles propositions ne peuvent pas encore être créées.</p><p className="mt-1 text-sm">{capacityReport?.propositions_en_attente_total.toLocaleString("fr-FR")} proposition(s) sont encore en attente. Validez-les ou rejetez-les avant de continuer.</p></div>}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border p-4"><div className="flex items-center gap-2 text-muted-foreground"><Users className="size-4" /><span className="text-sm">Immergés disponibles</span></div><p className="mt-2 text-2xl font-bold">{capacityReport?.candidats_disponibles ?? 0}</p></div>
              <div className="rounded-xl border p-4"><div className="flex items-center gap-2 text-muted-foreground"><Gauge className="size-4" /><span className="text-sm">Places encore proposables</span></div><p className="mt-2 text-2xl font-bold">{capacityReport?.disponible_total ?? 0}</p></div>
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4"><div className="flex items-center gap-2 text-primary"><CheckCircle2 className="size-4" /><span className="text-sm">Maximum proposable maintenant</span></div><p className="mt-2 text-2xl font-bold text-primary">{maxProposable}</p></div>
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.8fr)]">
              <div className="space-y-3">
                <Label htmlFor="batch-size">Nombre d’immergés à proposer</Label>
                <div className="flex flex-wrap gap-2">
                  {quickSizes.map((size) => <Button key={size} type="button" disabled={hasPendingProposals} variant={batchSize === size ? "default" : "outline"} onClick={() => setBatchSize(size)}>{size.toLocaleString("fr-FR")}</Button>)}
                  {maxProposable > 0 && <Button type="button" disabled={hasPendingProposals} variant={batchSize === maxProposable ? "default" : "outline"} onClick={() => setBatchSize(maxProposable)}>Tout le disponible ({maxProposable.toLocaleString("fr-FR")})</Button>}
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Input id="batch-size" className="h-12 text-base" type="number" min={1} disabled={hasPendingProposals} value={batchSize} onChange={(event) => setBatchSize(Number(event.target.value))} />
                  <Button disabled={busy || hasPendingProposals || !sessionId || effectiveBatchSize <= 0} className="h-12 shrink-0 rounded-xl px-6" onClick={() => void runTask(() => affectationsApi.proposeRegionalBatch({ session_id: sessionId, nombre: effectiveBatchSize, forcer_reliquat: forceAvailablePlaces }), "generation")}><Play className="size-4" />Générer {effectiveBatchSize.toLocaleString("fr-FR")} proposition(s)</Button>
                </div>
                {requestedBatchSize > maxProposable && maxProposable > 0 && <p className="text-sm text-amber-700">Vous avez demandé {requestedBatchSize.toLocaleString("fr-FR")}, mais seulement {maxProposable.toLocaleString("fr-FR")} proposition(s) peuvent être créées actuellement.</p>}
              </div>

              <div className="space-y-3">
                <Label>Mode de répartition</Label>
                <button type="button" disabled={hasPendingProposals} onClick={() => setForceAvailablePlaces(false)} className={`w-full rounded-xl border p-4 text-left transition ${!forceAvailablePlaces ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "hover:bg-muted/30"}`}><p className="font-semibold">Respecter la région d’origine</p><p className="mt-1 text-sm text-muted-foreground">Une région est proposée uniquement lorsqu’elle correspond suffisamment à l’origine de l’immergé.</p></button>
                <button type="button" disabled={hasPendingProposals} onClick={() => setForceAvailablePlaces(true)} className={`w-full rounded-xl border p-4 text-left transition ${forceAvailablePlaces ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "hover:bg-muted/30"}`}><p className="font-semibold">Répartir selon les places disponibles</p><p className="mt-1 text-sm text-muted-foreground">Les immergés restants peuvent être proposés dans une autre région disposant encore de places.</p></button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </PermissionGuard>

    {error && <div className="mb-5"><ErrorBox message={error} /></div>}
    {info && <div className="mb-5 rounded-2xl border border-primary/30 bg-primary/5 px-5 py-4 text-base font-medium leading-7 text-primary">{info}</div>}
    {progress && activeTaskKind !== "validation" && <Card className="mb-6"><CardContent className="p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">Traitement des propositions</p><p className="text-sm text-muted-foreground">{progress.message || progress.statut}</p></div><p className="text-2xl font-bold text-primary">{progress.progression}%</p></div><div className="mt-4 h-3 overflow-hidden rounded-full bg-primary/10"><div className="h-full bg-primary" style={{ width: `${progress.progression}%` }} /></div>{progress.resultat && <div className="mt-4 grid gap-3 text-sm sm:grid-cols-4"><p><b>{progress.resultat.candidats_pris}</b><br />candidat(s) pris</p><p><b>{progress.resultat.propositions_creees}</b><br />proposition(s)</p><p><b>{progress.resultat.sans_source.length}</b><br />sans source</p><p><b>{progress.resultat.sans_destination.length}</b><br />sans correspondance régionale</p></div>}</CardContent></Card>}

    <Card className="mb-6 overflow-hidden">
      <CardContent className="p-0">
        <div className="border-b p-6"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Étape 2</p><h2 className="mt-1 text-xl font-bold">Examiner et valider les propositions</h2><p className="mt-1 text-sm text-muted-foreground">Filtrez les propositions, contrôlez leur région de destination, puis validez ou rejetez la sélection.</p></div>
        <div className="space-y-4 p-5">
          <div className="relative"><Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" /><Input className="h-12 rounded-xl pl-12 text-base" placeholder="Rechercher par Code FasoIM, région ou motif" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-sm font-medium text-muted-foreground">Statut :</span>
            {statusOptions.map(([value, label]) => <Button key={label} type="button" size="sm" variant={status === value ? "default" : "outline"} onClick={() => { setStatus(value); void load({ status: value }) }}>{label}</Button>)}
            <span className="ml-3 mr-1 text-sm font-medium text-muted-foreground">Public :</span>
            {sessionPublic === "MIXTE" && <Button type="button" size="sm" variant={!typeImmerge ? "default" : "outline"} onClick={() => { setTypeImmerge(""); void load({ typeImmerge: "" }) }}>Tous</Button>}
            {availableTypeOptions.map(([value, label]) => <Button key={value} type="button" size="sm" variant={typeImmerge === value || sessionPublic === value ? "default" : "outline"} onClick={() => { setTypeImmerge(value); void load({ typeImmerge: value }) }}>{label}</Button>)}
            <Button type="button" size="sm" variant="secondary" className="ml-auto" onClick={() => void load()}>Actualiser</Button>
          </div>
        </div>
      </CardContent>
    </Card>

    {activeTaskKind === "validation" && taskId ? (
      <Card className="mb-4 border-primary/30 bg-primary/[0.03]">
        <CardContent className="p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-primary">Validation des affectations en cours</p>
              <p className="text-sm text-muted-foreground">{progress?.message || "La demande a été transmise. Le traitement démarre en arrière-plan."}</p>
            </div>
            <p className="text-xl font-bold text-primary">{progress ? `${progress.progression}%` : "Démarrage…"}</p>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-primary/10">
            {progress ? (
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${progress.progression}%` }}
              />
            ) : (
              <div className="h-full w-1/3 animate-pulse rounded-full bg-primary" />
            )}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Les boutons de validation sont temporairement masqués pour éviter un second lancement du même traitement.</p>
        </CardContent>
      </Card>
    ) : (
      <div className="mb-4 flex flex-wrap gap-2">
        <PermissionGuard permission={P.VALIDATE_REGIONAL_ASSIGNMENT}><Button disabled={busy || selectedProposed.length === 0} onClick={() => void runTask(() => affectationsApi.validateRegionalBatch({ affectation_ids: selectedProposed }), "validation")}><CheckCircle2 className="size-4" />Valider la sélection ({selectedProposed.length})</Button></PermissionGuard>
        <PermissionGuard permission={P.VALIDATE_REGIONAL_ASSIGNMENT}><Button variant="secondary" disabled={busy || proposedIds.length === 0} onClick={() => void runTask(() => affectationsApi.validateRegionalBatch({ affectation_ids: proposedIds }), "validation")}>Valider les propositions affichées ({proposedIds.length})</Button></PermissionGuard>
        <PermissionGuard permission={P.CANCEL_REGIONAL_ASSIGNMENT}><Button variant="destructive" disabled={busy || selectedProposed.length === 0} onClick={() => setRejectOpen(true)}><XCircle className="size-4" />Rejeter la sélection</Button></PermissionGuard>
      </div>
    )}

    {loading ? <Loading /> : filtered.length === 0 ? <EmptyState message="Aucune affectation régionale trouvée pour ces critères." /> : <Card className="overflow-hidden"><Table><TableHeader><TableRow><TableHead className="w-12 px-5"><input type="checkbox" className="size-4 accent-primary" checked={proposedIds.length > 0 && selectedProposed.length === proposedIds.length} onChange={(event) => toggleAll(event.target.checked)} /></TableHead><TableHead className="h-14">Immergé</TableHead><TableHead>Région proposée</TableHead><TableHead>Région d’origine</TableHead><TableHead>Statut</TableHead><TableHead>Justification</TableHead><TableHead /></TableRow></TableHeader><TableBody>{filtered.map((row) => <TableRow key={row.id} className="h-20"><TableCell className="px-5"><input type="checkbox" className="size-4 accent-primary" disabled={row.statut !== "PROPOSEE"} checked={selected.includes(row.id)} onChange={(event) => toggle(row.id, event.target.checked)} /></TableCell><TableCell><p className="font-semibold">{displayImmerge(row)}</p><p className="mt-1 text-sm text-muted-foreground">{displayType(row)}</p></TableCell><TableCell><p className="font-semibold">{row.region?.nom}</p></TableCell><TableCell><p>{row.profil_source?.region_reference || "Non précisée"}</p><p className="text-sm text-muted-foreground">{row.profil_source?.province_reference || "Province non précisée"}</p></TableCell><TableCell><StatusBadge value={row.statut.toLowerCase()} /></TableCell><TableCell className="max-w-sm"><p className="line-clamp-2 text-sm text-muted-foreground">{row.motif || "—"}</p></TableCell><TableCell className="text-right">{row.est_ouverte && <PermissionGuard permission={P.CANCEL_REGIONAL_ASSIGNMENT}><Button variant="outline" disabled={busy} onClick={() => { setCancelTarget(row); setCancelReason("") }}>Annuler</Button></PermissionGuard>}</TableCell></TableRow>)}</TableBody></Table></Card>}


    <Dialog open={rejectOpen} onOpenChange={(open) => { setRejectOpen(open); if (!open) setRejectReason("") }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Rejeter les propositions sélectionnées</DialogTitle>
          <DialogDescription>
            Vous allez rejeter {selectedProposed.length.toLocaleString("fr-FR")} proposition(s). Indiquez un motif clair : il sera conservé dans l’historique.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="regional-reject-reason">Motif du rejet *</Label>
          <textarea id="regional-reject-reason" className="min-h-32 w-full rounded-xl border bg-background p-3 text-base" value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} placeholder="Ex. Les régions proposées ne correspondent pas aux régions d’origine et le mode de redistribution n’avait pas été demandé." autoFocus />
          <p className="text-xs text-muted-foreground">Le motif doit permettre de comprendre la décision lors d’un contrôle ultérieur.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setRejectOpen(false)} disabled={busy}>Retour</Button>
          <Button variant="destructive" onClick={() => void rejectSelected()} disabled={busy || !rejectReason.trim()}>Confirmer le rejet</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={Boolean(cancelTarget)} onOpenChange={(open) => { if (!open) { setCancelTarget(null); setCancelReason("") } }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Annuler cette affectation régionale</DialogTitle>
          <DialogDescription>
            Cette action conserve l’affectation dans l’historique, mais libère la place réservée. Le motif est obligatoire.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="regional-cancel-reason">Motif de l’annulation *</Label>
          <textarea id="regional-cancel-reason" className="min-h-32 w-full rounded-xl border bg-background p-3 text-base" value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} placeholder="Ex. Proposition créée avec un mode de répartition incorrect." autoFocus />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setCancelTarget(null); setCancelReason("") }} disabled={busy}>Retour</Button>
          <Button variant="destructive" onClick={() => void confirmCancel()} disabled={busy || !cancelReason.trim()}>Confirmer l’annulation</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <PermissionGuard permission={P.ASSIGN_REGION}>
      <Card className="mt-6 overflow-hidden">
        <button type="button" className="flex w-full items-center justify-between gap-4 p-5 text-left" onClick={() => setShowManual((current) => !current)}><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-muted"><UserRoundCog className="size-5" /></span><div><h2 className="font-semibold">Affectation directe exceptionnelle</h2><p className="text-sm text-muted-foreground">À utiliser uniquement pour affecter immédiatement un immergé précis, sans passer par une proposition.</p></div></div><ChevronDown className={`size-5 transition ${showManual ? "rotate-180" : ""}`} /></button>
        {showManual && <CardContent className="border-t p-5"><form onSubmit={createManual} className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><Field label="Code FasoIM de l’immergé"><Input className="h-12" placeholder="Ex. IP2026BAC0200123" value={manualCodeFasoim} onChange={(event) => setManualCodeFasoim(event.target.value.toUpperCase())} required /></Field><Field label="Région d’affectation"><select className={selectClass} value={manualRegionId} onChange={(event) => setManualRegionId(event.target.value)} required><option value="">Choisir une région</option>{regions.map((region) => <option key={region.id} value={region.id}>{region.nom}</option>)}</select></Field></div><Field label="Motif de cette affectation directe"><textarea className={textareaClass} value={motif} onChange={(event) => setMotif(event.target.value)} placeholder="Expliquez pourquoi cette affectation ne passe pas par la proposition automatique." required /></Field><div className="flex justify-end"><Button disabled={busy || !manualCodeFasoim || !manualRegionId}>Affecter directement</Button></div></form></CardContent>}
      </Card>
    </PermissionGuard>
  </>
}
