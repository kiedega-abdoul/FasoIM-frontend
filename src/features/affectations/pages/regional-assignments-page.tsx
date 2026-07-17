/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { useEffect, useMemo, useRef, useState } from "react"
import { CheckCircle2, Play, Search, XCircle } from "lucide-react"

import { getApiErrorMessage } from "@/api/api-error"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState, ErrorBox, Loading, PageHeader, PermissionGuard, StatusBadge } from "@/features/accounts/components"
import { useAuthStore } from "@/stores/auth-store"
import { sessionsApi } from "@/features/sessions/api"
import type { ImmersionSession } from "@/features/sessions/types"
import { affectationsApi } from "../api"
import { AFFECTATION_PERMISSIONS as P } from "../permissions"
import { currentScopeParams } from "../scope"
import type { AssignmentProgress, Region, RegionalAssignment } from "../types"

const selectClass = "h-12 w-full rounded-xl border bg-background px-4 text-base"
const textareaClass = "min-h-24 w-full rounded-xl border bg-background p-3 text-base"
const typeOptions = [["BEPC", "BEPC"], ["BAC", "BAC"], ["CONCOURS", "Concours"], ["SELECTIONNE", "Sélectionnés"], ["VOLONTAIRE", "Volontaires"]] as const

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

export function RegionalAssignmentsPage() {
  const [rows, setRows] = useState<RegionalAssignment[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [sessions, setSessions] = useState<ImmersionSession[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState(String(currentSessionId() || ""))
  const [selected, setSelected] = useState<number[]>([])
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("")
  const [typeImmerge, setTypeImmerge] = useState("")
  const [regionId, setRegionId] = useState("")
  const [batchSize, setBatchSize] = useState(100)
  const [manualImmergeId, setManualImmergeId] = useState("")
  const [manualRegionId, setManualRegionId] = useState("")
  const [motif, setMotif] = useState("")
  const [taskId, setTaskId] = useState("")
  const [progress, setProgress] = useState<AssignmentProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")
  const unavailableProgressCount = useRef(0)
  const sessionId = Number(selectedSessionId || currentSessionId() || 0)
  const [forceAvailablePlaces, setForceAvailablePlaces] = useState(false)

  async function load() {
    setLoading(true)
    setError("")
    try {
      const scope = currentScopeParams() as Record<string, string | number | undefined>
      const assignmentsData = sessionId
        ? await affectationsApi.regionalAssignments({ ...scope, session_id: sessionId, region_id: regionId ? Number(regionId) : undefined, statut: status || undefined, type_immerge: typeImmerge || undefined })
        : []
      setRows(assignmentsData)

      const sessionsData = await sessionsApi.sessions(currentScopeParams())
      setSessions(sessionsData)
      if (!selectedSessionId && sessionsData.length) setSelectedSessionId(String(sessionsData[0].id))

      try {
        const regionsData = await affectationsApi.regions(scope)
        setRegions(regionsData)
        if (!manualRegionId && regionsData.length === 1) setManualRegionId(String(regionsData[0].id))
      } catch {
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
        if (["TERMINEE", "ECHEC", "ANNULEE", "REFUSEE"].includes(normalizedStatus)) {
          window.clearInterval(timer)
          setTaskId("")
          await load()
          return
        }
        if (unavailableProgressCount.current >= 5) {
          window.clearInterval(timer)
          setTaskId("")
          setInfo("Le suivi du traitement n’est pas encore disponible. La liste peut être actualisée dans quelques instants.")
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
    return rows.filter((row) => [displayImmerge(row), displayType(row), row.region?.nom, row.region?.code, row.statut, row.motif].filter(Boolean).some((item) => String(item).toLowerCase().includes(value)))
  }, [rows, query])

  const proposedIds = filtered.filter((row) => row.statut === "PROPOSEE").map((row) => row.id)
  const selectedProposed = selected.filter((id) => proposedIds.includes(id))

  function toggle(id: number, checked: boolean) {
    setSelected((current) => checked ? [...current, id] : current.filter((item) => item !== id))
  }

  function toggleAll(checked: boolean) {
    setSelected(checked ? proposedIds : [])
  }

  async function runTask(action: () => Promise<{ task_id: string; message: string }>) {
    setBusy(true)
    setError("")
    setInfo("")
    try {
      const task = await action()
      unavailableProgressCount.current = 0
      setTaskId(task.task_id)
      setProgress(null)
      setInfo(task.message || "Traitement lancé.")
    } catch (exception) {
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
      await affectationsApi.createRegionalAssignment({ immerge_id: Number(manualImmergeId), region_id: Number(manualRegionId), motif })
      setManualImmergeId("")
      setMotif("")
      await load()
    } catch (exception) {
      setError(getApiErrorMessage(exception))
    } finally {
      setBusy(false)
    }
  }

  async function cancelOne(row: RegionalAssignment) {
    const reason = window.prompt("Motif de l’annulation")?.trim()
    if (!reason) return
    setBusy(true)
    setError("")
    try {
      await affectationsApi.cancelRegionalAssignment(row.id, reason)
      await load()
    } catch (exception) {
      setError(getApiErrorMessage(exception))
    } finally {
      setBusy(false)
    }
  }

  return <>
    <PageHeader title="Affectations régionales" description="Propositions et validations des régions d’accueil des immergés." backTo="/app" />

    <Card className="mb-6 p-5"><div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_190px_210px_220px_auto]">
      <div className="relative"><Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" /><Input className="h-12 rounded-xl pl-12 text-base" placeholder="Rechercher par immergé, région, statut ou motif" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
      <select className={selectClass} value={selectedSessionId} onChange={(event) => setSelectedSessionId(event.target.value)}><option value="">Choisir une session</option>{sessions.map((session) => <option key={session.id} value={session.id}>{session.nom}</option>)}</select>
      <select className={selectClass} value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Tous les statuts</option><option value="PROPOSEE">Proposée</option><option value="ACTIVE">Validée</option><option value="REJETEE">Rejetée</option><option value="ANNULEE">Annulée</option></select>
      <select className={selectClass} value={typeImmerge} onChange={(event) => setTypeImmerge(event.target.value)}><option value="">Tous les publics</option>{typeOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      <select className={selectClass} value={regionId} onChange={(event) => setRegionId(event.target.value)}><option value="">Toutes les régions</option>{regions.map((region) => <option key={region.id} value={region.id}>{region.nom}</option>)}</select>
      <Button className="h-12 rounded-xl px-6" onClick={() => void load()}>Filtrer</Button>
    </div></Card>

    {error && <div className="mb-5"><ErrorBox message={error} /></div>}
    {info && <div className="mb-5 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm text-primary">{info}</div>}
    {progress && <Card className="mb-6"><CardContent className="p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">Traitement des propositions</p><p className="text-sm text-muted-foreground">{progress.message || progress.statut}</p></div><p className="text-2xl font-bold text-primary">{progress.progression}%</p></div><div className="mt-4 h-3 overflow-hidden rounded-full bg-primary/10"><div className="h-full bg-primary" style={{ width: `${progress.progression}%` }} /></div>{progress.resultat && <div className="mt-4 grid gap-3 text-sm sm:grid-cols-4"><p><b>{progress.resultat.candidats_pris}</b><br />candidat(s) pris</p><p><b>{progress.resultat.propositions_creees}</b><br />proposition(s)</p><p><b>{progress.resultat.sans_source.length}</b><br />sans source</p><p><b>{progress.resultat.sans_destination.length}</b><br />sans région disponible</p></div>}</CardContent></Card>}

    <div className="mb-6 grid gap-4 xl:grid-cols-2">
      <PermissionGuard permission={P.PROPOSE_REGIONAL_ASSIGNMENT}><Card><CardContent className="space-y-4 p-5"><div><h2 className="text-lg font-semibold">Proposer automatiquement</h2><p className="text-sm text-muted-foreground">Créer des propositions régionales pour un lot d’immergés.</p></div><div className="flex gap-3"><Input className="h-12" type="number" min={1} max={1000} value={batchSize} onChange={(event) => setBatchSize(Number(event.target.value))} /><Button disabled={busy || !sessionId} className="h-12 rounded-xl" onClick={() => void runTask(() => affectationsApi.proposeRegionalBatch({ session_id: sessionId, nombre: batchSize, forcer_reliquat: forceAvailablePlaces }))}><Play className="size-4" />Proposer</Button></div><label className="flex items-center gap-3 rounded-xl border p-3 text-sm"><input type="checkbox" className="size-4 accent-primary" checked={forceAvailablePlaces} onChange={(event) => setForceAvailablePlaces(event.target.checked)} /><span>Utiliser les régions qui ont encore des places si la région d’origine n’est pas disponible.</span></label></CardContent></Card></PermissionGuard>
      <PermissionGuard permission={P.ASSIGN_REGION}><Card><CardContent className="p-5"><form onSubmit={createManual} className="space-y-4"><div><h2 className="text-lg font-semibold">Affecter manuellement</h2><p className="text-sm text-muted-foreground">Affecter directement un immergé à une région.</p></div><div className="grid gap-3 sm:grid-cols-2"><Field label="Identifiant immergé"><Input className="h-12" type="number" min={1} value={manualImmergeId} onChange={(event) => setManualImmergeId(event.target.value)} required /></Field><Field label="Région"><select className={selectClass} value={manualRegionId} onChange={(event) => setManualRegionId(event.target.value)} required><option value="">Choisir une région</option>{regions.map((region) => <option key={region.id} value={region.id}>{region.nom}</option>)}</select></Field></div><Field label="Motif"><textarea className={textareaClass} value={motif} onChange={(event) => setMotif(event.target.value)} /></Field><div className="flex justify-end"><Button disabled={busy || !manualImmergeId || !manualRegionId}>Affecter</Button></div></form></CardContent></Card></PermissionGuard>
    </div>

    <div className="mb-4 flex flex-wrap gap-2">
      <PermissionGuard permission={P.VALIDATE_REGIONAL_ASSIGNMENT}><Button disabled={busy || selectedProposed.length === 0} onClick={() => void runTask(() => affectationsApi.validateRegionalBatch({ affectation_ids: selectedProposed }))}><CheckCircle2 className="size-4" />Valider la sélection</Button></PermissionGuard>
      <PermissionGuard permission={P.VALIDATE_REGIONAL_ASSIGNMENT}><Button variant="secondary" disabled={busy || proposedIds.length === 0} onClick={() => void runTask(() => affectationsApi.validateRegionalBatch({ affectation_ids: proposedIds }))}>Valider toutes les propositions visibles</Button></PermissionGuard>
      <PermissionGuard permission={P.CANCEL_REGIONAL_ASSIGNMENT}><Button variant="destructive" disabled={busy || selectedProposed.length === 0} onClick={() => { const reason = window.prompt("Motif du rejet")?.trim(); if (reason) void runTask(() => affectationsApi.rejectRegionalBatch({ affectation_ids: selectedProposed, motif: reason })) }}><XCircle className="size-4" />Rejeter la sélection</Button></PermissionGuard>
    </div>

    {loading ? <Loading /> : filtered.length === 0 ? <EmptyState message="Aucune affectation régionale trouvée." /> : <Card className="overflow-hidden"><Table><TableHeader><TableRow><TableHead className="w-12 px-5"><input type="checkbox" className="size-4 accent-primary" checked={proposedIds.length > 0 && selectedProposed.length === proposedIds.length} onChange={(event) => toggleAll(event.target.checked)} /></TableHead><TableHead className="h-14">Immergé</TableHead><TableHead>Région</TableHead><TableHead>Source</TableHead><TableHead>Statut</TableHead><TableHead>Motif</TableHead><TableHead /></TableRow></TableHeader><TableBody>{filtered.map((row) => <TableRow key={row.id} className="h-20"><TableCell className="px-5"><input type="checkbox" className="size-4 accent-primary" disabled={row.statut !== "PROPOSEE"} checked={selected.includes(row.id)} onChange={(event) => toggle(row.id, event.target.checked)} /></TableCell><TableCell><p className="font-semibold">{displayImmerge(row)}</p><p className="mt-1 text-sm text-muted-foreground">{displayType(row)}</p></TableCell><TableCell><p className="font-semibold">{row.region?.nom}</p><p className="text-sm text-muted-foreground">{row.region?.code}</p></TableCell><TableCell><p>{row.profil_source?.region_reference || "Non précisée"}</p><p className="text-sm text-muted-foreground">{row.profil_source?.province_reference || "Province non précisée"}</p></TableCell><TableCell><StatusBadge value={row.statut.toLowerCase()} /></TableCell><TableCell className="max-w-sm"><p className="line-clamp-2 text-sm text-muted-foreground">{row.motif || "—"}</p></TableCell><TableCell className="text-right">{row.est_ouverte && <PermissionGuard permission={P.CANCEL_REGIONAL_ASSIGNMENT}><Button variant="outline" disabled={busy} onClick={() => void cancelOne(row)}>Annuler</Button></PermissionGuard>}</TableCell></TableRow>)}</TableBody></Table></Card>}
  </>
}
