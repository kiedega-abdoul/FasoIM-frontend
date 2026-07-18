import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Building2, CheckSquare2, Plus, Search, Trash2 } from "lucide-react"

import { getApiErrorMessage } from "@/api/api-error"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { affectationsApi } from "@/features/affectations/api"
import type { Center } from "@/features/affectations/types"
import { ErrorBox, Loading, PageHeader } from "@/features/accounts/components"
import { organisationApi } from "@/features/organisation/api"
import type { CenterOrganizationRule } from "@/features/organisation/types"
import { sessionsApi } from "../api"
import { MODE_LABELS } from "../labels"
import type { ImmersionSession, SessionCenterSelection, SessionParametersPayload } from "../types"

const selectClass = "h-12 w-full rounded-xl border bg-background px-3 text-base"
const textAreaClass = "w-full rounded-xl border bg-background px-4 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
const empty: SessionParametersPayload = {
  mode_entree: "import",
  hebergement_active: true,
  repas_active: true,
  visite_medicale_active: false,
  mode_visite_medicale: "arrivee",
  activites_active: true,
  evaluation_active: false,
  attestation_active: true,
  consultation_publique_active: false,
  taux_presence_minimum_attestation: 80,
  moyenne_minimum_attestation: 10,
  directives_generales: "",
  consignes_generales: "",
  documents_exiges: [],
  centres_accueil: [],
}

type EligibleCenter = {
  centre: Center
  rule: CenterOrganizationRule
}

export function SessionParametersPage({ configure = false }: { configure?: boolean }) {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState<ImmersionSession | null>(null)
  const [form, setForm] = useState<SessionParametersPayload>(empty)
  const [eligibleCenters, setEligibleCenters] = useState<EligibleCenter[]>([])
  const [centerQuery, setCenterQuery] = useState("")
  const [document, setDocument] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!sessionId) return
    const id = Number(sessionId)

    queueMicrotask(() => {
      setLoading(true)
      void sessionsApi.session(id)
      .then(async (currentSession) => {
        setSession(currentSession)
        if (currentSession.parametres) {
          setForm({ ...currentSession.parametres, centres_accueil: currentSession.parametres.centres_accueil ?? [] })
        }

        const [centers, rules] = await Promise.all([
          affectationsApi.centers({ statut: "ACTIF", page_size: 1000 }),
          organisationApi.centerRules({ session_id: id, page_size: 1000 }),
        ])
        const centersById = new Map(centers.map((center) => [center.id, center]))
        const eligible = rules
          .filter((rule) => rule.capacite_ouverte > 0)
          .map((rule) => ({ centre: centersById.get(rule.centre.id), rule }))
          .filter((entry): entry is EligibleCenter => Boolean(entry.centre))
          .sort((a, b) => {
            const regionCompare = a.centre.region.nom.localeCompare(b.centre.region.nom, "fr")
            return regionCompare || a.centre.nom.localeCompare(b.centre.nom, "fr")
          })
        setEligibleCenters(eligible)
      })
      .catch((exception) => setError(getApiErrorMessage(exception)))
      .finally(() => setLoading(false))
    })
  }, [sessionId])

  function setField<K extends keyof SessionParametersPayload>(key: K, value: SessionParametersPayload[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function toggleCenter(entry: EligibleCenter) {
    const selected = form.centres_accueil.some((center) => center.centre_id === entry.centre.id)
    if (selected) {
      setField("centres_accueil", form.centres_accueil.filter((center) => center.centre_id !== entry.centre.id))
      return
    }
    const center: SessionCenterSelection = {
      centre_id: entry.centre.id,
      centre_code: entry.centre.code,
      centre_nom: entry.centre.nom,
    }
    setField("centres_accueil", [...form.centres_accueil, center])
  }

  const filteredCenters = useMemo(() => {
    const query = centerQuery.trim().toLowerCase()
    if (!query) return eligibleCenters
    return eligibleCenters.filter(({ centre }) => [centre.nom, centre.code, centre.region.nom, centre.ville, centre.province]
      .some((value) => value?.toLowerCase().includes(query)))
  }, [centerQuery, eligibleCenters])

  const totalCapacity = useMemo(() => {
    const selectedIds = new Set(form.centres_accueil.map((center) => center.centre_id))
    return eligibleCenters.reduce((sum, entry) => selectedIds.has(entry.centre.id) ? sum + entry.rule.capacite_ouverte : sum, 0)
  }, [eligibleCenters, form.centres_accueil])

  function selectAllVisible() {
    const current = new Map(form.centres_accueil.map((center) => [center.centre_id, center]))
    filteredCenters.forEach(({ centre }) => current.set(centre.id, {
      centre_id: centre.id,
      centre_code: centre.code,
      centre_nom: centre.nom,
    }))
    setField("centres_accueil", Array.from(current.values()))
  }

  function clearCenters() {
    setField("centres_accueil", [])
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!sessionId || !session) return
    if (form.centres_accueil.length === 0) {
      setError("Sélectionnez au moins un centre d’accueil pour cette session.")
      return
    }
    setSubmitting(true)
    setError("")
    try {
      if (configure) await sessionsApi.configureParameters(Number(sessionId), form)
      else if (session.parametres) await sessionsApi.updateParameters(session.parametres.id, form)
      navigate(`/app/sessions/${sessionId}`)
    } catch (exception) {
      setError(getApiErrorMessage(exception))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loading />
  if (!session) return <ErrorBox message={error || "Session introuvable."} />
  if (configure && session.parametres) return <ErrorBox message="Les paramètres sont déjà configurés." />
  if (!configure && !session.parametres) return <ErrorBox message="Les paramètres ne sont pas encore configurés." />

  return <>
    <PageHeader
      title={configure ? "Configurer les paramètres" : "Modifier les paramètres"}
      description="Choisissez les centres d’accueil, les services proposés, les seuils, les consignes et les documents exigés."
      backTo={`/app/sessions/${sessionId}`}
    />
    {error && <div className="mb-5"><ErrorBox message={error} /></div>}
    <form onSubmit={submit} className="space-y-6">
      <Card>
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 p-2 text-primary"><Building2 className="size-5" /></div>
                <div>
                  <h2 className="text-xl font-semibold">Centres d’accueil</h2>
                  <p className="text-sm text-muted-foreground">Seuls les centres disposant déjà d’une règle d’organisation et d’une capacité ouverte positive pour cette session sont proposés.</p>
                </div>
              </div>
            </div>
            <div className="grid min-w-[260px] grid-cols-2 gap-3">
              <div className="rounded-xl border bg-muted/30 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Centres retenus</p>
                <p className="mt-1 text-2xl font-semibold">{form.centres_accueil.length}</p>
              </div>
              <div className="rounded-xl border bg-muted/30 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Capacité totale</p>
                <p className="mt-1 text-2xl font-semibold">{totalCapacity}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <Input className="h-12 pl-12" value={centerQuery} onChange={(event) => setCenterQuery(event.target.value)} placeholder="Rechercher un centre, une région, une ville…" />
            </div>
            <Button type="button" variant="outline" className="h-12" onClick={selectAllVisible} disabled={filteredCenters.length === 0}>
              <CheckSquare2 className="mr-2 size-4" />Tout sélectionner
            </Button>
            <Button type="button" variant="outline" className="h-12" onClick={clearCenters} disabled={form.centres_accueil.length === 0}>Effacer</Button>
          </div>

          {eligibleCenters.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
              Aucun centre n’est encore prêt pour cette session. Les responsables de centre doivent d’abord créer leur règle d’organisation avec une capacité ouverte positive.
            </div>
          ) : filteredCenters.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed p-6 text-sm text-muted-foreground">Aucun centre ne correspond à la recherche.</div>
          ) : (
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filteredCenters.map((entry) => {
                const checked = form.centres_accueil.some((center) => center.centre_id === entry.centre.id)
                return <label key={entry.centre.id} className={`cursor-pointer rounded-xl border p-4 transition ${checked ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-primary/50"}`}>
                  <div className="flex items-start gap-3">
                    <input type="checkbox" className="mt-1 size-5 accent-primary" checked={checked} onChange={() => toggleCenter(entry)} />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold leading-tight">{entry.centre.nom}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{entry.centre.code} · {entry.centre.region.nom}</p>
                      <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                        <span>{entry.centre.ville || entry.centre.province}</span>
                        <span className="rounded-full bg-muted px-2.5 py-1 font-medium">{entry.rule.capacite_ouverte} places</span>
                      </div>
                    </div>
                  </div>
                </label>
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card><CardContent className="p-6 sm:p-8"><div className="space-y-2"><Label>Mode d’entrée *</Label><select className={selectClass} value={form.mode_entree} onChange={(e) => setField("mode_entree", e.target.value as SessionParametersPayload["mode_entree"])}>{Object.entries(MODE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{([['hebergement_active','Hébergement'],['repas_active','Repas'],['visite_medicale_active','Visite médicale'],['activites_active','Activités'],['evaluation_active','Évaluations'],['attestation_active','Attestations'],['consultation_publique_active','Consultation publique']] as const).map(([key,label]) => <label key={key} className="flex items-center justify-between rounded-xl border p-4"><span>{label}</span><input type="checkbox" className="size-5 accent-primary" checked={form[key]} onChange={(e) => setField(key,e.target.checked)} /></label>)}</div></CardContent></Card>

      {form.attestation_active && <Card><CardContent className="p-6 sm:p-8"><div className="grid gap-5 sm:grid-cols-2"><div className="space-y-2"><Label>Présence minimale (%)</Label><Input type="number" min={0} max={100} value={form.taux_presence_minimum_attestation} onChange={(e) => setField("taux_presence_minimum_attestation",Number(e.target.value))} /></div><div className="space-y-2"><Label>Moyenne minimale (/20)</Label><Input type="number" min={0} max={20} step="0.5" value={form.moyenne_minimum_attestation} onChange={(e) => setField("moyenne_minimum_attestation",Number(e.target.value))} /></div></div></CardContent></Card>}

      <Card><CardContent className="p-6 sm:p-8"><div className="grid gap-5"><div className="space-y-2"><Label>Directives générales</Label><p className="text-sm text-muted-foreground">Orientations officielles de la session.</p><textarea rows={5} className={textAreaClass} value={form.directives_generales} onChange={(e) => setField("directives_generales",e.target.value)} /></div><div className="space-y-2"><Label>Consignes générales</Label><p className="text-sm text-muted-foreground">Règles pratiques à respecter.</p><textarea rows={5} className={textAreaClass} value={form.consignes_generales} onChange={(e) => setField("consignes_generales",e.target.value)} /></div><div className="space-y-3"><Label>Documents exigés</Label><p className="text-sm text-muted-foreground">Uniquement les pièces à fournir, par exemple une copie de la CNIB.</p><div className="flex gap-3"><Input value={document} onChange={(e) => setDocument(e.target.value)} placeholder="Ex. Copie de la CNIB" /><Button type="button" variant="outline" onClick={() => { const value=document.trim(); if(value){ setField("documents_exiges",[...form.documents_exiges,value]); setDocument("") } }}><Plus className="mr-2 size-4" />Ajouter</Button></div>{form.documents_exiges.map((value,index) => <div key={`${value}-${index}`} className="flex items-center justify-between rounded-xl border px-4 py-3"><span>{value}</span><Button type="button" variant="ghost" onClick={() => setField("documents_exiges",form.documents_exiges.filter((_,current) => current!==index))}><Trash2 className="size-4" /></Button></div>)}</div></div></CardContent></Card>

      <div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => navigate(`/app/sessions/${sessionId}`)}>Annuler</Button><Button type="submit" disabled={submitting || eligibleCenters.length === 0}>{submitting ? "Enregistrement…" : "Enregistrer"}</Button></div>
    </form>
  </>
}
