/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { BedDouble, Eye, Search } from "lucide-react"

import { getApiErrorMessage } from "@/api/api-error"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { affectationsApi } from "@/features/affectations/api"
import { currentCenterId, currentScopeParams } from "@/features/affectations/scope"
import type { Center } from "@/features/affectations/types"
import { EmptyState, ErrorBox, Loading, PageHeader, PermissionGuard, StatusBadge } from "@/features/accounts/components"
import { organisationApi } from "../api"
import { ORGANISATION_PERMISSIONS as P } from "../permissions"
import type { Bed, BedPayload, Dormitory, DormitoryPayload } from "../types"

const selectClass = "h-12 w-full rounded-xl border bg-background px-4 text-base"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>
}

const normalizedStatus = (value?: string) => String(value || "").trim().toUpperCase()
const isActive = (value?: string) => normalizedStatus(value) === "ACTIF" || normalizedStatus(value) === "ACTIVE" || normalizedStatus(value) === "DISPONIBLE"
const isOutOfService = (value?: string) => normalizedStatus(value) === "HORS_SERVICE"

export function DormitoriesPage() {
  const [rows, setRows] = useState<Dormitory[]>([])
  const [centers, setCenters] = useState<Center[]>([])
  const [query, setQuery] = useState("")
  const [centerId, setCenterId] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const scope = currentScopeParams()
      const effectiveCenterId = centerId || scope.centre_id || currentCenterId() || undefined
      if (!effectiveCenterId) {
        const centersData = await affectationsApi.centers(scope)
        setCenters(centersData)
        setRows([])
        setError("")
        return
      }
      const [dormitoriesData, centersData] = await Promise.all([
        organisationApi.dormitories({ centre_id: effectiveCenterId }),
        affectationsApi.centers(scope),
      ])
      setRows(dormitoriesData)
      setCenters(centersData)
      setError("")
    } catch (exception) {
      setError(getApiErrorMessage(exception))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase()
    if (!value) return rows
    return rows.filter((dormitory) => [dormitory.nom, dormitory.centre?.nom, dormitory.sexe_dortoir, dormitory.statut].filter(Boolean).some((item) => String(item).toLowerCase().includes(value)))
  }, [rows, query])

  return <>
    <PageHeader title="Dortoirs" description="Espaces d’hébergement rattachés aux centres d’accueil." backTo="/app" actionTo="/app/dortoirs/nouveau" actionLabel="Nouveau dortoir" actionPermission={P.CREATE_DORMITORY} />
    <Card className="mb-6 p-5"><div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_260px_auto]"><div className="relative"><Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" /><Input className="h-12 rounded-xl pl-12 text-base" placeholder="Rechercher par dortoir, centre, sexe ou statut" value={query} onChange={(event) => setQuery(event.target.value)} /></div><select className={selectClass} value={centerId} onChange={(event) => setCenterId(event.target.value)}><option value="">Tous les centres</option>{centers.map((center) => <option key={center.id} value={center.id}>{center.nom}</option>)}</select><Button className="h-12 rounded-xl px-6" onClick={() => void load()}>Filtrer</Button></div></Card>
    {error && <ErrorBox message={error} />}
    {loading ? <Loading /> : !error && filtered.length === 0 ? <EmptyState message="Aucun dortoir trouvé." /> : <Card className="overflow-hidden"><Table><TableHeader><TableRow><TableHead className="h-14 px-5">Dortoir</TableHead><TableHead>Centre</TableHead><TableHead>Capacité</TableHead><TableHead>Statut</TableHead><TableHead /></TableRow></TableHeader><TableBody>{filtered.map((dormitory) => <TableRow key={dormitory.id} className="h-20"><TableCell className="px-5"><p className="font-semibold">{dormitory.nom}</p><p className="mt-1 text-sm text-muted-foreground">{dormitory.sexe_dortoir}</p></TableCell><TableCell>{dormitory.centre?.nom}</TableCell><TableCell>{dormitory.capacite} lits</TableCell><TableCell><StatusBadge value={dormitory.statut.toLowerCase()} /></TableCell><TableCell className="text-right"><div className="flex justify-end gap-2"><Button render={<Link to={`/app/dortoirs/${dormitory.id}`} />} variant="outline" className="gap-2 rounded-xl"><Eye className="size-4" />Voir</Button><PermissionGuard permission={P.UPDATE_DORMITORY}><Button render={<Link to={`/app/dortoirs/${dormitory.id}/modifier`} />} variant="outline" className="rounded-xl">Modifier</Button></PermissionGuard>{isActive(dormitory.statut) && <PermissionGuard permission={P.MAINTAIN_DORMITORY}><Button variant="secondary" className="rounded-xl" onClick={async () => { await organisationApi.maintainDormitory(dormitory.id); await load() }}>Hors service</Button></PermissionGuard>}{isOutOfService(dormitory.statut) && <PermissionGuard permission={P.UPDATE_DORMITORY}><Button variant="secondary" className="rounded-xl" onClick={async () => { await organisationApi.enableDormitory(dormitory.id); await load() }}>Réactiver</Button></PermissionGuard>}</div></TableCell></TableRow>)}</TableBody></Table></Card>}
  </>
}

export function DormitoryDetailPage() {
  const { id } = useParams()
  const [dormitory, setDormitory] = useState<Dormitory | null>(null)
  const [beds, setBeds] = useState<Bed[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")

  async function load() {
    if (!id) return
    setLoading(true)
    setError("")
    try {
      const dormitoryData = await organisationApi.dormitory(Number(id))
      const bedsData = await organisationApi.beds({ centre_id: dormitoryData.centre.id, dortoir_id: dormitoryData.id })
      setDormitory(dormitoryData)
      setBeds(bedsData)
    } catch (exception) {
      setError(getApiErrorMessage(exception))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [id])

  async function generateBeds() {
    if (!dormitory) return
    setBusy(true)
    setError("")
    setInfo("")
    try {
      const result = await organisationApi.generateDormitoryBeds(dormitory.id)
      setInfo(result.crees ? `${result.crees} lit(s) créé(s).` : "Tous les lits existent déjà.")
      await load()
    } catch (exception) {
      setError(getApiErrorMessage(exception))
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <Loading />
  if (!dormitory) return <><PageHeader title="Dortoir" backTo="/app/dortoirs" />{error ? <ErrorBox message={error} /> : <EmptyState message="Dortoir introuvable." />}</>

  const availableBeds = beds.filter((bed) => bed.est_utilisable).length
  const missingBeds = Math.max(0, dormitory.capacite - beds.length)

  return <>
    <PageHeader title={dormitory.nom} description="Informations du dortoir et lits rattachés." backTo="/app/dortoirs" />
    {error && <div className="mb-5"><ErrorBox message={error} /></div>}
    {info && <div className="mb-5 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm text-primary">{info}</div>}
    <div className="space-y-6">
      <Card><CardContent className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3"><h2 className="text-2xl font-bold">{dormitory.nom}</h2><StatusBadge value={dormitory.statut.toLowerCase()} /></div>
            <p className="mt-2 text-sm text-muted-foreground">{dormitory.centre?.nom} · {dormitory.sexe_dortoir}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <PermissionGuard permission={P.CREATE_BED}><Button onClick={() => void generateBeds()} disabled={busy || missingBeds === 0} className="gap-2 rounded-xl"><BedDouble className="size-4" />Créer les lits</Button></PermissionGuard>
            <PermissionGuard permission={P.UPDATE_DORMITORY}><Button render={<Link to={`/app/dortoirs/${dormitory.id}/modifier`} />} variant="outline" className="rounded-xl">Modifier</Button></PermissionGuard>
            {isActive(dormitory.statut) && <PermissionGuard permission={P.MAINTAIN_DORMITORY}><Button variant="secondary" className="rounded-xl" disabled={busy} onClick={async () => { setBusy(true); await organisationApi.maintainDormitory(dormitory.id); await load(); setBusy(false) }}>Hors service</Button></PermissionGuard>}
            {isOutOfService(dormitory.statut) && <PermissionGuard permission={P.UPDATE_DORMITORY}><Button variant="secondary" className="rounded-xl" disabled={busy} onClick={async () => { setBusy(true); await organisationApi.enableDormitory(dormitory.id); await load(); setBusy(false) }}>Réactiver</Button></PermissionGuard>}
          </div>
        </div>
      </CardContent></Card>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Capacité</p><p className="mt-1 text-2xl font-semibold">{dormitory.capacite}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Lits créés</p><p className="mt-1 text-2xl font-semibold">{beds.length}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Lits utilisables</p><p className="mt-1 text-2xl font-semibold">{availableBeds}</p></CardContent></Card>
      </section>

      <Card className="overflow-hidden"><Table><TableHeader><TableRow><TableHead className="h-14 px-5">Lit</TableHead><TableHead>Statut</TableHead><TableHead>Utilisable</TableHead><TableHead /></TableRow></TableHeader><TableBody>{beds.map((bed) => <TableRow key={bed.id} className="h-16"><TableCell className="px-5 font-semibold">Lit {bed.numero_lit}</TableCell><TableCell><StatusBadge value={bed.statut.toLowerCase()} /></TableCell><TableCell>{bed.est_utilisable ? "Oui" : "Non"}</TableCell><TableCell className="text-right"><PermissionGuard permission={P.UPDATE_BED}><Button render={<Link to={`/app/lits/${bed.id}/modifier`} />} variant="outline" className="rounded-xl">Modifier</Button></PermissionGuard></TableCell></TableRow>)}</TableBody></Table>{beds.length === 0 && <div className="p-8 text-center text-muted-foreground">Aucun lit créé pour ce dortoir.</div>}</Card>
    </div>
  </>
}

function emptyDormitory(): DormitoryPayload {
  return { centre_id: 0, nom: "", capacite: 1, sexe_dortoir: "MASCULIN", statut: "ACTIF" }
}

export function DormitoryFormPage({ edit = false }: { edit?: boolean }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [centers, setCenters] = useState<Center[]>([])
  const [form, setForm] = useState<DormitoryPayload>(emptyDormitory)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    Promise.all([affectationsApi.centers(currentScopeParams()), edit && id ? organisationApi.dormitory(Number(id)) : Promise.resolve(null)])
      .then(([centersData, dormitory]) => {
        setCenters(centersData)
        if (dormitory) setForm({ centre_id: dormitory.centre.id, nom: dormitory.nom, capacite: dormitory.capacite, sexe_dortoir: dormitory.sexe_dortoir, statut: dormitory.statut })
      })
      .catch((exception) => setError(getApiErrorMessage(exception)))
      .finally(() => setLoading(false))
  }, [edit, id])

  function setField<K extends keyof DormitoryPayload>(key: K, value: DormitoryPayload[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError("")
    try {
      if (edit && id) await organisationApi.updateDormitory(Number(id), form)
      else await organisationApi.createDormitory(form)
      navigate("/app/dortoirs")
    } catch (exception) {
      setError(getApiErrorMessage(exception))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loading />
  return <><PageHeader title={edit ? "Modifier le dortoir" : "Créer un dortoir"} description="Renseignez le centre, le type d’accueil et le nombre de lits." backTo="/app/dortoirs" />{error && <div className="mb-5"><ErrorBox message={error} /></div>}<form onSubmit={submit} className="space-y-6"><Card><CardContent className="grid gap-5 p-6 sm:grid-cols-2"><Field label="Centre *"><select className={selectClass} value={form.centre_id || ""} onChange={(event) => setField("centre_id", Number(event.target.value))} required><option value="">Sélectionner un centre</option>{centers.map((center) => <option key={center.id} value={center.id}>{center.nom} · {center.ville}</option>)}</select></Field><Field label="Sexe du dortoir *"><select className={selectClass} value={form.sexe_dortoir} onChange={(event) => setField("sexe_dortoir", event.target.value)}><option value="MASCULIN">Masculin</option><option value="FEMININ">Féminin</option></select></Field><Field label="Nom *"><Input className="h-12" value={form.nom} onChange={(event) => setField("nom", event.target.value)} required /></Field><Field label="Capacité *"><Input className="h-12" type="number" min={1} value={form.capacite} onChange={(event) => setField("capacite", Number(event.target.value))} required /></Field></CardContent></Card><div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => navigate("/app/dortoirs")}>Annuler</Button><Button type="submit" disabled={submitting}>{submitting ? "Enregistrement..." : "Enregistrer"}</Button></div></form></>
}

export function BedsPage() {
  const [rows, setRows] = useState<Bed[]>([])
  const [dormitories, setDormitories] = useState<Dormitory[]>([])
  const [query, setQuery] = useState("")
  const [dormitoryId, setDormitoryId] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const scope = currentScopeParams()
      const effectiveCenterId = scope.centre_id || currentCenterId()
      if (!effectiveCenterId) {
        setRows([])
        setDormitories([])
        setError("")
        return
      }
      const dormitoriesData = await organisationApi.dormitories({ centre_id: effectiveCenterId })
      const selectedDormitoryId = dormitoryId || dormitoriesData[0]?.id
      const bedsData = selectedDormitoryId ? await organisationApi.beds({ centre_id: effectiveCenterId, dortoir_id: selectedDormitoryId }) : []
      setRows(bedsData)
      setDormitories(dormitoriesData)
      setError("")
    } catch (exception) {
      setError(getApiErrorMessage(exception))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase()
    if (!value) return rows
    return rows.filter((bed) => [bed.numero_lit, bed.dortoir?.nom, bed.dortoir?.centre?.nom, bed.statut].filter(Boolean).some((item) => String(item).toLowerCase().includes(value)))
  }, [rows, query])

  return <>
    <PageHeader title="Lits" description="Lits disponibles dans les dortoirs des centres d’accueil." backTo="/app" actionTo="/app/lits/nouveau" actionLabel="Nouveau lit" actionPermission={P.CREATE_BED} />
    <Card className="mb-6 p-5"><div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_260px_auto]"><div className="relative"><Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" /><Input className="h-12 rounded-xl pl-12 text-base" placeholder="Rechercher par numéro, dortoir, centre ou statut" value={query} onChange={(event) => setQuery(event.target.value)} /></div><select className={selectClass} value={dormitoryId} onChange={(event) => setDormitoryId(event.target.value)}><option value="">Tous les dortoirs</option>{dormitories.map((dormitory) => <option key={dormitory.id} value={dormitory.id}>{dormitory.nom} · {dormitory.centre?.nom}</option>)}</select><Button className="h-12 rounded-xl px-6" onClick={() => void load()}>Filtrer</Button></div></Card>
    {error && <ErrorBox message={error} />}
    {loading ? <Loading /> : !error && filtered.length === 0 ? <EmptyState message="Aucun lit trouvé." /> : <Card className="overflow-hidden"><Table><TableHeader><TableRow><TableHead className="h-14 px-5">Lit</TableHead><TableHead>Dortoir</TableHead><TableHead>Centre</TableHead><TableHead>Statut</TableHead><TableHead /></TableRow></TableHeader><TableBody>{filtered.map((bed) => <TableRow key={bed.id} className="h-20"><TableCell className="px-5"><p className="font-semibold">Lit {bed.numero_lit}</p><p className="mt-1 text-sm text-muted-foreground">{bed.est_utilisable ? "Utilisable" : "Non utilisable"}</p></TableCell><TableCell>{bed.dortoir?.nom}</TableCell><TableCell>{bed.dortoir?.centre?.nom}</TableCell><TableCell><StatusBadge value={bed.statut.toLowerCase()} /></TableCell><TableCell className="text-right"><div className="flex justify-end gap-2"><PermissionGuard permission={P.UPDATE_BED}><Button render={<Link to={`/app/lits/${bed.id}/modifier`} />} variant="outline" className="rounded-xl">Modifier</Button></PermissionGuard>{isActive(bed.statut) && <PermissionGuard permission={P.MAINTAIN_BED}><Button variant="secondary" className="rounded-xl" onClick={async () => { await organisationApi.maintainBed(bed.id); await load() }}>Hors service</Button></PermissionGuard>}{isOutOfService(bed.statut) && <PermissionGuard permission={P.ENABLE_BED}><Button variant="secondary" className="rounded-xl" onClick={async () => { await organisationApi.enableBed(bed.id); await load() }}>Réactiver</Button></PermissionGuard>}</div></TableCell></TableRow>)}</TableBody></Table></Card>}
  </>
}

function emptyBed(): BedPayload {
  return { dortoir_id: 0, numero_lit: "", statut: "DISPONIBLE" }
}

export function BedFormPage({ edit = false }: { edit?: boolean }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [dormitories, setDormitories] = useState<Dormitory[]>([])
  const [form, setForm] = useState<BedPayload>(emptyBed)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const centerId = currentCenterId()
    Promise.all([centerId ? organisationApi.dormitories({ centre_id: centerId }) : Promise.resolve([]), edit && id ? organisationApi.bed(Number(id)) : Promise.resolve(null)])
      .then(([dormitoriesData, bed]) => {
        setDormitories(dormitoriesData)
        if (bed) setForm({ dortoir_id: bed.dortoir.id, numero_lit: bed.numero_lit, statut: bed.statut })
      })
      .catch((exception) => setError(getApiErrorMessage(exception)))
      .finally(() => setLoading(false))
  }, [edit, id])

  function setField<K extends keyof BedPayload>(key: K, value: BedPayload[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError("")
    try {
      if (edit && id) await organisationApi.updateBed(Number(id), form)
      else await organisationApi.createBed(form)
      navigate("/app/lits")
    } catch (exception) {
      setError(getApiErrorMessage(exception))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loading />
  return <><PageHeader title={edit ? "Modifier le lit" : "Créer un lit"} description="Renseignez le dortoir et le numéro du lit." backTo="/app/lits" />{error && <div className="mb-5"><ErrorBox message={error} /></div>}<form onSubmit={submit} className="space-y-6"><Card><CardContent className="grid gap-5 p-6 sm:grid-cols-2"><Field label="Dortoir *"><select className={selectClass} value={form.dortoir_id || ""} onChange={(event) => setField("dortoir_id", Number(event.target.value))} required><option value="">Sélectionner un dortoir</option>{dormitories.map((dormitory) => <option key={dormitory.id} value={dormitory.id}>{dormitory.nom} · {dormitory.centre?.nom}</option>)}</select></Field><Field label="Numéro de lit *"><Input className="h-12" value={form.numero_lit} onChange={(event) => setField("numero_lit", event.target.value)} required /></Field></CardContent></Card><div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => navigate("/app/lits")}>Annuler</Button><Button type="submit" disabled={submitting}>{submitting ? "Enregistrement..." : "Enregistrer"}</Button></div></form></>
}
