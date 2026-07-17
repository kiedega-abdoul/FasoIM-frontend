/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { Search } from "lucide-react"

import { getApiErrorMessage } from "@/api/api-error"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState, ErrorBox, Loading, PageHeader, PermissionGuard, StatusBadge } from "@/features/accounts/components"
import { affectationsApi } from "../api"
import { AFFECTATION_PERMISSIONS as P } from "../permissions"
import { currentScopeParams } from "../scope"
import type { Center, CenterPayload, Region, RegionPayload } from "../types"

const selectClass = "h-12 w-full rounded-xl border bg-background px-4 text-base"
const textAreaClass = "w-full rounded-xl border bg-background px-4 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
const split = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean)
const publicOptions = [
  ["BEPC", "BEPC"],
  ["BAC", "BAC"],
  ["CONCOURS", "Concours"],
  ["SELECTIONNE", "Sélectionnés"],
  ["VOLONTAIRE", "Volontaires"],
] as const

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>
}

function PublicsAcceptesField({ value, onChange }: { value: string[]; onChange: (value: string[]) => void }) {
  function toggle(publicCode: string, checked: boolean) {
    onChange(checked ? [...value, publicCode] : value.filter((item) => item !== publicCode))
  }

  return <div className="space-y-3">
    <Label>Publics acceptés</Label>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {publicOptions.map(([code, label]) => <label key={code} className="flex min-h-12 items-center gap-3 rounded-xl border bg-background px-4 text-sm">
        <input type="checkbox" className="size-4 accent-primary" checked={value.includes(code)} onChange={(event) => toggle(code, event.target.checked)} />
        <span>{label}</span>
      </label>)}
    </div>
    <p className="text-sm text-muted-foreground">Laissez tout décoché si le centre accepte tous les types d’immergés.</p>
  </div>
}

export function RegionsPage() {
  const [rows, setRows] = useState<Region[]>([])
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      setRows(await affectationsApi.regions({ ...currentScopeParams(), statut: status || undefined }))
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
    return rows.filter((region) => [region.nom, region.code, region.statut].some((item) => item?.toLowerCase().includes(value)))
  }, [rows, query])

  return <>
    <PageHeader title="Régions d’immersion" description="Régions utilisées pour organiser les centres d’accueil." backTo="/app" actionTo="/app/regions/nouvelle" actionLabel="Nouvelle région" actionPermission={P.CREATE_REGION} />
    <Card className="mb-6 p-5"><div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px_auto]"><div className="relative"><Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" /><Input className="h-12 rounded-xl pl-12 text-base" placeholder="Rechercher par nom, code ou statut" value={query} onChange={(event) => setQuery(event.target.value)} /></div><select className={selectClass} value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Tous les statuts</option><option value="ACTIVE">Active</option><option value="DESACTIVEE">Désactivée</option></select><Button className="h-12 rounded-xl px-6" onClick={() => void load()}>Filtrer</Button></div></Card>
    {error && <ErrorBox message={error} />}
    {loading ? <Loading /> : !error && filtered.length === 0 ? <EmptyState message="Aucune région trouvée." /> : <Card className="overflow-hidden"><Table><TableHeader><TableRow><TableHead className="h-14 px-5">Région</TableHead><TableHead>Code</TableHead><TableHead>Statut</TableHead><TableHead /></TableRow></TableHeader><TableBody>{filtered.map((region) => <TableRow key={region.id} className="h-20"><TableCell className="px-5"><p className="font-semibold">{region.nom}</p><p className="mt-1 text-sm text-muted-foreground">{region.description || "Aucune description"}</p></TableCell><TableCell>{region.code}</TableCell><TableCell><StatusBadge value={region.statut.toLowerCase()} /></TableCell><TableCell className="text-right"><PermissionGuard permission={P.UPDATE_REGION}><Button render={<Link to={`/app/regions/${region.id}/modifier`} />} variant="outline" className="rounded-xl">Modifier</Button></PermissionGuard></TableCell></TableRow>)}</TableBody></Table></Card>}
  </>
}

function emptyRegion(): RegionPayload {
  return { nom: "", description: "", statut: "ACTIVE" }
}

export function RegionFormPage({ edit = false }: { edit?: boolean }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState<RegionPayload>(emptyRegion)
  const [loading, setLoading] = useState(edit)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!edit || !id) { setLoading(false); return }
    affectationsApi.region(Number(id)).then((region) => setForm({ nom: region.nom, description: region.description || "", statut: region.statut })).catch((exception) => setError(getApiErrorMessage(exception))).finally(() => setLoading(false))
  }, [edit, id])

  function setField<K extends keyof RegionPayload>(key: K, value: RegionPayload[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError("")
    try {
      if (edit && id) await affectationsApi.updateRegion(Number(id), form)
      else await affectationsApi.createRegion(form)
      navigate("/app/regions")
    } catch (exception) {
      setError(getApiErrorMessage(exception))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loading />
  return <><PageHeader title={edit ? "Modifier la région" : "Créer une région"} description="Renseignez les informations de la région d’accueil." backTo="/app/regions" />{error && <div className="mb-5"><ErrorBox message={error} /></div>}<form onSubmit={submit} className="space-y-6"><Card><CardContent className="grid gap-5 p-6"><Field label="Nom *"><Input className="h-12" value={form.nom} onChange={(event) => setField("nom", event.target.value)} required /></Field><Field label="Description"><textarea rows={4} className={textAreaClass} value={form.description} onChange={(event) => setField("description", event.target.value)} /></Field></CardContent></Card><div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => navigate("/app/regions")}>Annuler</Button><Button type="submit" disabled={submitting}>{submitting ? "Enregistrement..." : "Enregistrer"}</Button></div></form></>
}

export function CentersPage() {
  const [rows, setRows] = useState<Center[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [query, setQuery] = useState("")
  const [regionCode, setRegionCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const scope = currentScopeParams()
      const [centersData, regionsData] = await Promise.all([
        affectationsApi.centers({ ...scope, region_code: regionCode || scope.region_code || undefined }),
        affectationsApi.regions(scope),
      ])
      setRows(centersData)
      setRegions(regionsData)
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
    return rows.filter((center) => [center.nom, center.code, center.province, center.ville, center.region?.nom, center.statut].filter(Boolean).some((item) => String(item).toLowerCase().includes(value)))
  }, [rows, query])

  return <>
    <PageHeader title="Centres d’immersion" description="Centres d’accueil, localisation et conditions de participation." backTo="/app" actionTo="/app/centres/nouveau" actionLabel="Nouveau centre" actionPermission={P.CREATE_CENTER} />
    <Card className="mb-6 p-5"><div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_240px_auto]"><div className="relative"><Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" /><Input className="h-12 rounded-xl pl-12 text-base" placeholder="Rechercher par centre, code, ville ou région" value={query} onChange={(event) => setQuery(event.target.value)} /></div><select className={selectClass} value={regionCode} onChange={(event) => setRegionCode(event.target.value)}><option value="">Toutes les régions</option>{regions.map((region) => <option key={region.id} value={region.code}>{region.nom}</option>)}</select><Button className="h-12 rounded-xl px-6" onClick={() => void load()}>Filtrer</Button></div></Card>
    {error && <ErrorBox message={error} />}
    {loading ? <Loading /> : !error && filtered.length === 0 ? <EmptyState message="Aucun centre trouvé." /> : <Card className="overflow-hidden"><Table><TableHeader><TableRow><TableHead className="h-14 px-5">Centre</TableHead><TableHead>Région</TableHead><TableHead>Accueil</TableHead><TableHead>Statut</TableHead><TableHead /></TableRow></TableHeader><TableBody>{filtered.map((center) => <TableRow key={center.id} className="h-20"><TableCell className="px-5"><p className="font-semibold">{center.nom}</p><p className="mt-1 text-sm text-muted-foreground">{center.code} · {center.ville}</p></TableCell><TableCell>{center.region?.nom}</TableCell><TableCell><p>{center.genre}</p><p className="text-sm text-muted-foreground">{(center.publics_acceptes || []).join(", ") || "Tous publics"}</p></TableCell><TableCell><StatusBadge value={center.statut.toLowerCase()} /></TableCell><TableCell className="text-right"><div className="flex justify-end gap-2"><PermissionGuard permission={P.UPDATE_CENTER}><Button render={<Link to={`/app/centres/${center.id}/modifier`} />} variant="outline" className="rounded-xl">Modifier</Button></PermissionGuard><PermissionGuard permission={P.MAINTAIN_CENTER}><Button variant="secondary" className="rounded-xl" onClick={async () => { await affectationsApi.maintainCenter(center.id); await load() }}>Maintenance</Button></PermissionGuard><PermissionGuard permission={P.ENABLE_CENTER}><Button variant="secondary" className="rounded-xl" onClick={async () => { await affectationsApi.enableCenter(center.id); await load() }}>Réactiver</Button></PermissionGuard></div></TableCell></TableRow>)}</TableBody></Table></Card>}
  </>
}

function emptyCenter(): CenterPayload {
  return { region_id: 0, nom: "", province: "", ville: "", adresse: "", genre: "MIXTE", publics_acceptes: [], niveaux_acceptes: [], statut: "ACTIF" }
}

export function CenterFormPage({ edit = false }: { edit?: boolean }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [regions, setRegions] = useState<Region[]>([])
  const [form, setForm] = useState<CenterPayload>(emptyCenter)
  const [niveaux, setNiveaux] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    Promise.all([affectationsApi.regions(currentScopeParams()), edit && id ? affectationsApi.center(Number(id)) : Promise.resolve(null)])
      .then(([regionsData, center]) => {
        setRegions(regionsData)
        if (center) {
          setForm({ region_id: center.region.id, nom: center.nom, province: center.province, ville: center.ville, adresse: center.adresse || "", genre: center.genre, publics_acceptes: center.publics_acceptes || [], niveaux_acceptes: center.niveaux_acceptes || [], statut: center.statut })
          setNiveaux((center.niveaux_acceptes || []).join(", "))
        }
      })
      .catch((exception) => setError(getApiErrorMessage(exception)))
      .finally(() => setLoading(false))
  }, [edit, id])

  function setField<K extends keyof CenterPayload>(key: K, value: CenterPayload[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError("")
    try {
      const payload = { ...form, niveaux_acceptes: split(niveaux) }
      if (edit && id) await affectationsApi.updateCenter(Number(id), payload)
      else await affectationsApi.createCenter(payload)
      navigate("/app/centres")
    } catch (exception) {
      setError(getApiErrorMessage(exception))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loading />
  return <><PageHeader title={edit ? "Modifier le centre" : "Créer un centre"} description="Renseignez la région, l’adresse et les conditions d’accueil du centre." backTo="/app/centres" />{error && <div className="mb-5"><ErrorBox message={error} /></div>}<form onSubmit={submit} className="space-y-6"><Card><CardContent className="grid gap-5 p-6 sm:grid-cols-2"><Field label="Région *"><select className={selectClass} value={form.region_id || ""} onChange={(event) => setField("region_id", Number(event.target.value))} required><option value="">Sélectionner une région</option>{regions.map((region) => <option key={region.id} value={region.id}>{region.nom}</option>)}</select></Field><Field label="Genre *"><select className={selectClass} value={form.genre} onChange={(event) => setField("genre", event.target.value)}><option value="MIXTE">Mixte</option><option value="MASCULIN">Masculin</option><option value="FEMININ">Féminin</option></select></Field><Field label="Nom *"><Input className="h-12" value={form.nom} onChange={(event) => setField("nom", event.target.value)} required /></Field><Field label="Province *"><Input className="h-12" value={form.province} onChange={(event) => setField("province", event.target.value)} required /></Field><Field label="Ville *"><Input className="h-12" value={form.ville} onChange={(event) => setField("ville", event.target.value)} required /></Field><Field label="Adresse"><Input className="h-12" value={form.adresse} onChange={(event) => setField("adresse", event.target.value)} /></Field><div className="sm:col-span-2"><PublicsAcceptesField value={form.publics_acceptes} onChange={(value) => setField("publics_acceptes", value)} /></div><div className="sm:col-span-2"><Field label="Niveaux, séries ou filières acceptés"><Input className="h-12" placeholder="Ex. BEPC, BAC_D, BAC_A, BAC_G2" value={niveaux} onChange={(event) => setNiveaux(event.target.value)} /><p className="text-sm text-muted-foreground">Optionnel. Utilisé surtout pour affiner les centres compatibles BEPC/BAC. Séparez plusieurs valeurs par des virgules.</p></Field></div></CardContent></Card><div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => navigate("/app/centres")}>Annuler</Button><Button type="submit" disabled={submitting}>{submitting ? "Enregistrement..." : "Enregistrer"}</Button></div></form></>
}
