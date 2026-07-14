/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { AlertTriangle, Archive, CalendarDays, CheckCircle2, FileText, Pencil, Play, Settings2, Trash2, XCircle } from "lucide-react"

import { getApiErrorMessage } from "@/api/api-error"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ErrorBox, Loading, PageHeader } from "@/features/accounts/components"
import { sessionsApi } from "../api"
import { SessionPermissionGuard, SessionStatusBadge } from "../components"
import { formatDate, MODE_LABELS, PUBLIC_LABELS, SESSION_TYPE_LABELS } from "../labels"
import { SESSION_PERMISSIONS as P } from "../permissions"
import type { ImmersionSession } from "../types"

const textAreaClass = "w-full rounded-xl border bg-background px-4 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"

export function SessionDetailPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState<ImmersionSession | null>(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState("")
  const [cancelReason, setCancelReason] = useState("")
  const [cancelOpen, setCancelOpen] = useState(false)
  const [closureBlocks, setClosureBlocks] = useState<string[]>([])

  async function load() {
    if (!sessionId) return
    try { setSession(await sessionsApi.session(Number(sessionId))); setError("") }
    catch (exception) { setError(getApiErrorMessage(exception)) }
  }
  useEffect(() => { void load() }, [sessionId])

  async function runAction(name: string, action: () => Promise<unknown>) {
    setBusy(name); setError(""); setClosureBlocks([])
    try { await action(); await load() }
    catch (exception) {
      const message = getApiErrorMessage(exception)
      setError(message)
      const maybeBlocks = (exception as { response?: { data?: { blocages?: unknown[]; session?: { blocages?: unknown[] } } } })?.response?.data
      const blocks = maybeBlocks?.blocages ?? maybeBlocks?.session?.blocages ?? []
      if (Array.isArray(blocks)) setClosureBlocks(blocks.map((block) => typeof block === "string" ? block : JSON.stringify(block)))
    } finally { setBusy("") }
  }

  if (error && !session) return <ErrorBox message={error} />
  if (!session) return <Loading />

  const p = session.parametres
  const canEdit = ["brouillon", "ouverte", "en_preparation", "en_cours"].includes(session.statut)
  const canCancel = ["brouillon", "ouverte", "en_preparation", "en_cours"].includes(session.statut)

  return <>
    <PageHeader title={session.nom} description={`${session.code} · Promotion ${session.numero_promotion}`} backTo="/app/sessions" />
    {error && <div className="mb-5"><ErrorBox message={error} /></div>}
    {closureBlocks.length > 0 && <Card className="mb-5 border-amber-300 bg-amber-50"><CardContent className="p-5"><div className="flex gap-3"><AlertTriangle className="mt-0.5 size-5 text-amber-700" /><div><h3 className="font-semibold text-amber-950">La session ne peut pas encore être terminée</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900">{closureBlocks.map((block, index) => <li key={index}>{block}</li>)}</ul></div></div></CardContent></Card>}

    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Statut</p><div className="mt-2"><SessionStatusBadge status={session.statut} /></div></CardContent></Card>
      <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Type et public</p><p className="mt-2 font-semibold">{SESSION_TYPE_LABELS[session.type_session]}</p><p className="text-sm text-muted-foreground">{PUBLIC_LABELS[session.public_cible]}</p></CardContent></Card>
      <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Période</p><p className="mt-2 font-semibold">{formatDate(session.date_debut)}</p><p className="text-sm text-muted-foreground">au {formatDate(session.date_fin)}</p></CardContent></Card>
      <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Mode d’entrée</p><p className="mt-2 font-semibold">{p ? MODE_LABELS[p.mode_entree] : "Non configuré"}</p></CardContent></Card>
    </section>

    <div className="mt-6 flex flex-wrap gap-3">
      {canEdit && <SessionPermissionGuard permission={P.UPDATE}><Button render={<Link to={`/app/sessions/${session.id}/modifier`} />} variant="outline"><Pencil className="mr-2 size-4" />Modifier la session</Button></SessionPermissionGuard>}
      {!p && <SessionPermissionGuard permission={P.CONFIGURE}><Button render={<Link to={`/app/sessions/${session.id}/parametres/configurer`} />}><Settings2 className="mr-2 size-4" />Configurer les paramètres</Button></SessionPermissionGuard>}
      {p && <SessionPermissionGuard permission={P.UPDATE_SETTINGS}><Button render={<Link to={`/app/sessions/${session.id}/parametres/modifier`} />} variant="outline"><Settings2 className="mr-2 size-4" />Modifier les paramètres</Button></SessionPermissionGuard>}
      {p && session.statut === "brouillon" && <SessionPermissionGuard permission={P.UPDATE}><Button disabled={busy !== ""} onClick={() => void runAction("open", () => sessionsApi.open(session.id))}><CalendarDays className="mr-2 size-4" />Ouvrir</Button><Button variant="outline" disabled={busy !== ""} onClick={() => void runAction("prepare", () => sessionsApi.prepare(session.id))}><Settings2 className="mr-2 size-4" />Mettre en préparation</Button></SessionPermissionGuard>}
      {p && session.statut === "ouverte" && <SessionPermissionGuard permission={P.UPDATE}><Button variant="outline" disabled={busy !== ""} onClick={() => void runAction("prepare", () => sessionsApi.prepare(session.id))}><Settings2 className="mr-2 size-4" />Mettre en préparation</Button><Button disabled={busy !== ""} onClick={() => void runAction("start", () => sessionsApi.start(session.id))}><Play className="mr-2 size-4" />Démarrer</Button></SessionPermissionGuard>}
      {p && session.statut === "en_preparation" && <SessionPermissionGuard permission={P.UPDATE}><Button variant="outline" disabled={busy !== ""} onClick={() => void runAction("open", () => sessionsApi.open(session.id))}><CalendarDays className="mr-2 size-4" />Ouvrir</Button><Button disabled={busy !== ""} onClick={() => void runAction("start", () => sessionsApi.start(session.id))}><Play className="mr-2 size-4" />Démarrer</Button></SessionPermissionGuard>}
      {session.statut === "en_cours" && <SessionPermissionGuard permission={P.CLOSE}><Button disabled={busy !== ""} onClick={() => void runAction("finish", () => sessionsApi.finish(session.id))}><CheckCircle2 className="mr-2 size-4" />Vérifier et terminer</Button></SessionPermissionGuard>}
      {session.statut === "terminee" && <SessionPermissionGuard permission={P.ARCHIVE}><Button disabled={busy !== ""} onClick={() => void runAction("archive", () => sessionsApi.archive(session.id))}><Archive className="mr-2 size-4" />Archiver</Button></SessionPermissionGuard>}
      {canCancel && <SessionPermissionGuard permission={P.UPDATE}><Dialog open={cancelOpen} onOpenChange={setCancelOpen}><DialogTrigger render={<Button variant="destructive"><XCircle className="mr-2 size-4" />Annuler la session</Button>} /><DialogContent><DialogHeader><DialogTitle>Annuler cette session</DialogTitle><DialogDescription>La session restera visible dans l’historique. Le motif est obligatoire.</DialogDescription></DialogHeader><div className="space-y-2"><Label>Motif de l’annulation</Label><textarea className={textAreaClass} rows={5} value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} placeholder="Ex. Décision officielle de report de la session." /></div><DialogFooter><Button variant="outline" onClick={() => setCancelOpen(false)}>Retour</Button><Button variant="destructive" disabled={!cancelReason.trim() || busy !== ""} onClick={() => void runAction("cancel", async () => { await sessionsApi.cancel(session.id, cancelReason); setCancelOpen(false) })}>Confirmer l’annulation</Button></DialogFooter></DialogContent></Dialog></SessionPermissionGuard>}
      {p && session.statut === "brouillon" && <SessionPermissionGuard permission={P.ARCHIVE}><Button variant="ghost" className="text-destructive" disabled={busy !== ""} onClick={() => { if (window.confirm("Supprimer logiquement cette session créée par erreur ?")) void runAction("delete", async () => { await sessionsApi.remove(session.id); navigate("/app/sessions") }) }}><Trash2 className="mr-2 size-4" />Supprimer</Button></SessionPermissionGuard>}
    </div>

    <section className="mt-8 grid gap-6 xl:grid-cols-2">
      <Card><CardContent className="p-6"><h2 className="text-xl font-semibold">Informations générales</h2><dl className="mt-5 grid gap-5 sm:grid-cols-2">{[
        ["Année", session.annee], ["Promotion", session.numero_promotion], ["Ouverture des inscriptions", formatDate(session.date_ouverture_inscription)], ["Fermeture des inscriptions", formatDate(session.date_fermeture_inscription)],
      ].map(([label, value]) => <div key={String(label)}><dt className="text-sm text-muted-foreground">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div>)}</dl><div className="mt-6"><p className="text-sm text-muted-foreground">Description</p><p className="mt-2 whitespace-pre-wrap leading-7">{session.description || "Aucune description."}</p></div></CardContent></Card>
      {p ? <>
      <Card><CardContent className="p-6"><h2 className="text-xl font-semibold">Modules activés</h2><div className="mt-5 flex flex-wrap gap-2">{[
        [p.hebergement_active, "Hébergement"], [p.repas_active, "Repas"], [p.visite_medicale_active, "Visite médicale"], [p.activites_active, "Activités"], [p.evaluation_active, "Évaluations"], [p.attestation_active, "Attestations"], [p.consultation_publique_active, "Consultation publique"],
      ].map(([active, label]) => <Badge key={String(label)} variant={active ? "default" : "secondary"}>{label}: {active ? "activé" : "désactivé"}</Badge>)}</div>{p.attestation_active && <div className="mt-6 grid gap-4 sm:grid-cols-2"><div><p className="text-sm text-muted-foreground">Présence minimale</p><p className="mt-1 font-semibold">{p.taux_presence_minimum_attestation} %</p></div><div><p className="text-sm text-muted-foreground">Moyenne minimale</p><p className="mt-1 font-semibold">{p.moyenne_minimum_attestation}/20</p></div></div>}</CardContent></Card>
      <Card><CardContent className="p-6"><h2 className="text-xl font-semibold">Directives et consignes</h2><div className="mt-5 space-y-5"><div><p className="text-sm text-muted-foreground">Directives générales</p><p className="mt-2 whitespace-pre-wrap leading-7">{p.directives_generales || "Aucune directive."}</p></div><div><p className="text-sm text-muted-foreground">Consignes générales</p><p className="mt-2 whitespace-pre-wrap leading-7">{p.consignes_generales || "Aucune consigne."}</p></div></div></CardContent></Card>
      <Card><CardContent className="p-6"><h2 className="flex items-center gap-2 text-xl font-semibold"><FileText className="size-5" />Documents exigés</h2>{p.documents_exiges.length === 0 ? <p className="mt-5 text-muted-foreground">Aucun document exigé.</p> : <ul className="mt-5 space-y-2">{p.documents_exiges.map((document, index) => <li key={`${document}-${index}`} className="rounded-xl border px-4 py-3">{document}</li>)}</ul>}</CardContent></Card>
      </> : <Card className="xl:col-span-2"><CardContent className="p-6"><h2 className="text-xl font-semibold">Paramètres non configurés</h2><p className="mt-2 text-muted-foreground">La session est créée, mais ses modules et règles opérationnelles doivent encore être configurés avant tout changement de statut.</p></CardContent></Card>}
    </section>

    {session.statut === "annulee" && <Card className="mt-6 border-destructive/30"><CardContent className="p-6"><h2 className="text-xl font-semibold text-destructive">Session annulée</h2><p className="mt-2"><span className="font-medium">Motif :</span> {session.motif_annulation || "Non précisé"}</p><p className="mt-1 text-sm text-muted-foreground">Date : {formatDate(session.date_annulation)}</p></CardContent></Card>}
  </>
}
