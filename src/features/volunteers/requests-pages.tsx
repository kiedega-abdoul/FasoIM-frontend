import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock3, Eye, LoaderCircle, Search, UsersRound, XCircle } from "lucide-react"
import { Link, useNavigate, useParams } from "react-router-dom"

import { getApiErrorMessage } from "@/api/api-error"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { currentAssignmentSessionParams } from "@/services/current-assignment-scope"
import { useAuthStore } from "@/stores/auth-store"
import { volunteerRequestsApi } from "./requests-api"
import { VOLUNTEER_REQUEST_PERMISSIONS as P } from "./requests-permissions"
import type { VolunteerRequest } from "./requests-types"

const STATUS_LABELS: Record<string, string> = {
  EN_ATTENTE: "En attente",
  ACCEPTEE: "Acceptée",
  REJETEE: "Rejetée",
  ANNULEE: "Annulée",
}

function statusBadge(status: string) {
  if (status === "ACCEPTEE") return <Badge className="bg-primary/10 text-primary hover:bg-primary/10">Acceptée</Badge>
  if (status === "REJETEE") return <Badge variant="destructive">Rejetée</Badge>
  if (status === "ANNULEE") return <Badge variant="secondary">Annulée</Badge>
  return <Badge variant="outline">En attente</Badge>
}

function date(value: string | null) {
  return value ? new Date(value).toLocaleDateString("fr-FR") : "Non renseignée"
}

function usePermission(code: string) {
  return useAuthStore((state) => state.context?.affectation_courante?.permissions?.includes(code) ?? false)
}

export function VolunteerRequestsListPage() {
  const [items, setItems] = useState<VolunteerRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("TOUS")
  const [selected, setSelected] = useState<number[]>([])
  const [batchOpen, setBatchOpen] = useState(false)
  const [batchLoading, setBatchLoading] = useState(false)
  const [batchMessage, setBatchMessage] = useState("")
  const canBatch = usePermission(P.ACCEPT_BATCH)

  async function load() {
    setLoading(true)
    setError("")
    try {
      setItems(await volunteerRequestsApi.list({
        ...currentAssignmentSessionParams(),
        recherche: search || undefined,
        statut_demande: status === "TOUS" ? undefined : status,
      }))
    } catch (exception) {
      setError(getApiErrorMessage(exception))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    void volunteerRequestsApi
      .list(currentAssignmentSessionParams())
      .then((data) => {
        if (!cancelled) {
          setItems(data)
        }
      })
      .catch((exception) => {
        if (!cancelled) {
          setError(getApiErrorMessage(exception))
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const selectable = useMemo(
    () => items.filter((item) => item.statut_demande === "EN_ATTENTE" && item.acceptable).map((item) => item.id),
    [items],
  )

  function toggle(id: number) {
    setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id])
  }

  async function launchBatch() {
    if (!selected.length) return
    setBatchLoading(true)
    setBatchMessage("")
    try {
      const selectedItems = items.filter((item) =>
        selected.includes(item.id),
      )

      const sessionIds = [
        ...new Set(selectedItems.map((item) => item.session)),
      ]

      if (sessionIds.length !== 1) {
        setBatchMessage(
          "Les demandes sélectionnées doivent appartenir à une seule session.",
        )
        return
      }

      const sessionId = sessionIds[0]

      if (sessionId === undefined) {
        setBatchMessage(
          "Impossible de déterminer la session des demandes sélectionnées.",
        )
        return
      }

      const launch = await volunteerRequestsApi.acceptBatch(
        selected,
        sessionId,
      )

      setBatchMessage(`Traitement lancé pour ${launch.total} demande(s).`)
      const identifiant =
        launch.progression_identifiant ??
        `acceptation_volontaires:${launch.task_id}`

      for (let attempt = 0; attempt < 120; attempt += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 1500))
        const progress = await volunteerRequestsApi.batchProgress(identifiant, sessionId)
        const progressStatus = progress.statut ?? progress.status
        setBatchMessage(progress.message || `Traitement en cours : ${progress.pourcentage ?? progress.progression ?? 0}%`)
        if (["TERMINE", "TERMINEE", "SUCCESS", "ECHEC", "FAILED"].includes(String(progressStatus).toUpperCase())) break
      }
      setSelected([])
      await load()
    } catch (exception) {
      setBatchMessage(getApiErrorMessage(exception))
    } finally {
      setBatchLoading(false)
    }
  }

  const pending = items.filter((item) => item.statut_demande === "EN_ATTENTE").length
  const accepted = items.filter((item) => item.statut_demande === "ACCEPTEE").length
  const blocked = items.filter((item) => item.statut_demande === "EN_ATTENTE" && !item.acceptable).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Demandes volontaires</h1>
        <p className="mt-2 text-muted-foreground">Consultez, vérifiez et traitez les demandes reçues.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="flex items-center gap-4 p-5"><Clock3 className="size-8 text-primary" /><div><p className="text-2xl font-bold">{pending}</p><p className="text-sm text-muted-foreground">En attente</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-5"><CheckCircle2 className="size-8 text-primary" /><div><p className="text-2xl font-bold">{accepted}</p><p className="text-sm text-muted-foreground">Acceptées</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-5"><AlertTriangle className="size-8 text-amber-600" /><div><p className="text-2xl font-bold">{blocked}</p><p className="text-sm text-muted-foreground">À vérifier</p></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des demandes</CardTitle>
          <CardDescription>Seules les demandes complètes et en attente peuvent être acceptées en lot.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <form className="grid gap-3 sm:grid-cols-[1fr_220px_auto]" onSubmit={(event) => { event.preventDefault(); void load() }}>
            <div className="relative"><Search className="absolute left-3 top-3.5 size-4 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} className="h-11 pl-10" placeholder="Nom, code, téléphone, e-mail ou CNIB" /></div>
            <Select value={status} onValueChange={(value) => setStatus(value ?? "TOUS")}><SelectTrigger className="h-11"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="TOUS">Tous les statuts</SelectItem><SelectItem value="EN_ATTENTE">En attente</SelectItem><SelectItem value="ACCEPTEE">Acceptées</SelectItem><SelectItem value="REJETEE">Rejetées</SelectItem><SelectItem value="ANNULEE">Annulées</SelectItem></SelectContent></Select>
            <Button type="submit" className="h-11">Rechercher</Button>
          </form>

          {canBatch && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/20 p-4">
              <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={selectable.length > 0 && selectable.every((id) => selected.includes(id))} onChange={(event) => setSelected(event.target.checked ? selectable : [])} />Tout sélectionner parmi les demandes acceptables</label>
              <Button disabled={!selected.length} onClick={() => setBatchOpen(true)}><UsersRound className="mr-2 size-4" />Accepter la sélection ({selected.length})</Button>
            </div>
          )}

          {error && <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive">{error}</div>}
          {loading ? <div className="flex justify-center py-12"><LoaderCircle className="size-7 animate-spin text-primary" /></div> : (
            <div className="overflow-x-auto rounded-xl border">
              <Table>
                <TableHeader><TableRow>{canBatch && <TableHead className="w-12" />}<TableHead>Volontaire</TableHead><TableHead>Session</TableHead><TableHead>Soumission</TableHead><TableHead>Complétude</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                <TableBody>
                  {items.map((item) => {
                    const enabled = item.statut_demande === "EN_ATTENTE" && item.acceptable
                    return <TableRow key={item.id}>
                      {canBatch && <TableCell><input type="checkbox" disabled={!enabled} checked={selected.includes(item.id)} onChange={() => toggle(item.id)} /></TableCell>}
                      <TableCell><p className="font-semibold">{item.identite_affichable}</p><p className="text-sm text-muted-foreground">{item.code_suivi} · {item.telephone}</p></TableCell>
                      <TableCell><p className="font-medium">{item.session_nom || `Session #${item.session}`}</p><p className="text-sm text-muted-foreground">{item.session_code}</p></TableCell>
                      <TableCell>{date(item.date_soumission)}</TableCell>
                      <TableCell>
  {item.statut_demande === "ACCEPTEE" ? (
    <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
      <CheckCircle2 className="size-4" />
      Validée
    </span>
  ) : item.statut_demande === "EN_ATTENTE" && item.acceptable ? (
    <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
      <CheckCircle2 className="size-4" />
      Complète
    </span>
  ) : item.statut_demande === "EN_ATTENTE" ? (
    <span className="inline-flex items-center gap-1 text-sm font-medium text-amber-700">
      <AlertTriangle className="size-4" />
      À vérifier
    </span>
  ) : (
    <span className="text-sm text-muted-foreground">
      Non applicable
    </span>
  )}
</TableCell>
                      <TableCell>{statusBadge(item.statut_demande)}</TableCell>
                      <TableCell className="text-right"><Link to={`/app/demandes-volontaires/${item.id}`} className={buttonVariants({ variant: "outline", size: "sm", className: "gap-2" })}><Eye className="size-4" />Voir</Link></TableCell>
                    </TableRow>
                  })}
                  {!items.length && <TableRow><TableCell colSpan={canBatch ? 7 : 6} className="py-12 text-center text-muted-foreground">Aucune demande trouvée.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={batchOpen} onOpenChange={setBatchOpen}>
        <DialogContent><DialogHeader><DialogTitle>Accepter les demandes sélectionnées</DialogTitle><DialogDescription>Le système revérifiera chaque demande avant de créer les immergés et leurs codes FasoIM.</DialogDescription></DialogHeader>{batchMessage && <div className="rounded-lg border bg-muted/30 p-4 text-sm">{batchMessage}</div>}<DialogFooter><Button variant="outline" onClick={() => setBatchOpen(false)} disabled={batchLoading}>Retour</Button><Button onClick={() => void launchBatch()} disabled={batchLoading}>{batchLoading && <LoaderCircle className="mr-2 size-4 animate-spin" />}Confirmer l’acceptation</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  )
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 wrap-break-word font-medium">{value || "Non renseigné"}</p></div>
}

export function VolunteerRequestDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState<VolunteerRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [acceptOpen, setAcceptOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [motif, setMotif] = useState("")
  const [actionLoading, setActionLoading] = useState(false)
  const canAccept = usePermission(P.ACCEPT)
  const canReject = usePermission(P.REJECT)

  useEffect(() => {
    if (!id) return

    let cancelled = false

    void volunteerRequestsApi
      .detail(Number(id))
      .then((data) => {
        if (!cancelled) {
          setItem(data)
        }
      })
      .catch((exception) => {
        if (!cancelled) {
          setError(getApiErrorMessage(exception))
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [id])

  async function accept() {
    if (!item) return
    setActionLoading(true)
    try { setItem(await volunteerRequestsApi.accept(item.id)); setAcceptOpen(false) }
    catch (exception) { setError(getApiErrorMessage(exception)) }
    finally { setActionLoading(false) }
  }

  async function reject() {
    if (!item || !motif.trim()) return
    setActionLoading(true)
    try { setItem(await volunteerRequestsApi.reject(item.id, motif.trim())); setRejectOpen(false); setMotif("") }
    catch (exception) { setError(getApiErrorMessage(exception)) }
    finally { setActionLoading(false) }
  }

  if (loading) return <div className="flex justify-center py-20"><LoaderCircle className="size-8 animate-spin text-primary" /></div>
  if (!item) return <div className="space-y-4"><div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive">{error || "Demande introuvable."}</div><Button variant="outline" onClick={() => navigate(-1)}>Retour</Button></div>

  const pending = item.statut_demande === "EN_ATTENTE"
  return <div className="space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div><Link to="/app/demandes-volontaires" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />Retour à la liste</Link><h1 className="mt-3 text-3xl font-bold tracking-tight">{item.identite_affichable}</h1><p className="mt-2 text-muted-foreground">{item.code_suivi} · {item.session_nom}</p></div>
      <div className="flex flex-wrap items-center gap-2">{statusBadge(item.statut_demande)}{pending && canReject && <Button variant="destructive" onClick={() => setRejectOpen(true)}><XCircle className="mr-2 size-4" />Rejeter</Button>}{pending && canAccept && <Button disabled={!item.acceptable} onClick={() => setAcceptOpen(true)}><CheckCircle2 className="mr-2 size-4" />Accepter</Button>}</div>
    </div>

    {error && <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive">{error}</div>}
    {!item.acceptable && pending && <Card className="border-amber-300 bg-amber-50"><CardHeader><CardTitle className="flex items-center gap-2 text-amber-800"><AlertTriangle className="size-5" />Demande non acceptable actuellement</CardTitle><CardDescription>Les éléments suivants doivent être vérifiés avant toute acceptation.</CardDescription></CardHeader><CardContent><ul className="list-disc space-y-2 pl-5 text-sm">{item.blocages_acceptation.map((blockage) => <li key={blockage}>{blockage}</li>)}</ul></CardContent></Card>}

    <div className="grid gap-6 xl:grid-cols-2">
      <Card><CardHeader><CardTitle>Identité</CardTitle></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2"><Info label="Nom" value={item.nom} /><Info label="Prénom(s)" value={item.prenoms} /><Info label="Sexe" value={item.sexe} /><Info label="Date de naissance" value={date(item.date_naissance)} /><Info label="Lieu de naissance" value={item.lieu_naissance} /><Info label="Nationalité" value={item.nationalite} /><Info label="Numéro CNIB" value={item.numero_cnib} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Contacts</CardTitle></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2"><Info label="Téléphone" value={item.telephone} /><Info label="Adresse e-mail" value={item.email} /><Info label="Contact d’urgence" value={item.nom_contact_urgence} /><Info label="Téléphone d’urgence" value={item.contact_urgence} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Résidence et profil</CardTitle></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2"><Info label="Région" value={item.region_residence} /><Info label="Province" value={item.province_residence} /><Info label="Commune" value={item.commune_residence} /><Info label="Adresse" value={item.adresse_residence} /><Info label="Niveau d’étude" value={item.niveau_etude} /><Info label="Profession" value={item.profession} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Traitement de la demande</CardTitle></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2"><Info label="Session" value={item.session_nom} /><Info label="Soumise le" value={date(item.date_soumission)} /><Info label="Statut" value={STATUS_LABELS[item.statut_demande] || item.statut_libelle} /><Info label="Décision le" value={date(item.date_decision)} />{item.motif_decision && <div className="sm:col-span-2"><Info label="Motif de décision" value={item.motif_decision} /></div>}</CardContent></Card>
    </div>
    <Card><CardHeader><CardTitle>Motivation</CardTitle></CardHeader><CardContent><p className="whitespace-pre-wrap leading-7">{item.motivation}</p></CardContent></Card>

    <Dialog open={acceptOpen} onOpenChange={setAcceptOpen}><DialogContent><DialogHeader><DialogTitle>Confirmer l’acceptation</DialogTitle><DialogDescription>Le volontaire sera créé comme immergé et recevra automatiquement un code FasoIM.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setAcceptOpen(false)} disabled={actionLoading}>Retour</Button><Button onClick={() => void accept()} disabled={actionLoading}>{actionLoading && <LoaderCircle className="mr-2 size-4 animate-spin" />}Confirmer l’acceptation</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={rejectOpen} onOpenChange={setRejectOpen}><DialogContent><DialogHeader><DialogTitle>Rejeter la demande</DialogTitle><DialogDescription>Indiquez clairement le motif. Il sera visible par le volontaire dans son suivi.</DialogDescription></DialogHeader><div className="space-y-2"><Label htmlFor="motif-rejet">Motif du rejet *</Label><textarea id="motif-rejet" value={motif} onChange={(event) => setMotif(event.target.value)} className="min-h-32 w-full rounded-md border bg-background px-3 py-2 text-sm" /></div><DialogFooter><Button variant="outline" onClick={() => setRejectOpen(false)} disabled={actionLoading}>Retour</Button><Button variant="destructive" onClick={() => void reject()} disabled={actionLoading || !motif.trim()}>{actionLoading && <LoaderCircle className="mr-2 size-4 animate-spin" />}Confirmer le rejet</Button></DialogFooter></DialogContent></Dialog>
  </div>
}
