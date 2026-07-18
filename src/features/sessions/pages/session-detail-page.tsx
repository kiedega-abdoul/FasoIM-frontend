/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { AlertTriangle, Archive, Building2, CalendarDays, CheckCircle2, FileText, Gauge, MapPinned, Pencil, Play, Settings2, Trash2, XCircle } from "lucide-react"

import { getApiErrorMessage } from "@/api/api-error"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ErrorBox, Loading, PageHeader } from "@/features/accounts/components"
import { affectationsApi } from "@/features/affectations/api"
import type { RegionalCapacityReport } from "@/features/affectations/types"
import { useAuthStore } from "@/stores/auth-store"
import { resolveWorkspace } from "@/workspaces/workspace-resolver"
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
  const assignment = useAuthStore((state) => state.context?.affectation_courante)
  const isDgas = resolveWorkspace(assignment) === "DGAS"
  const [capacityReport, setCapacityReport] = useState<RegionalCapacityReport | null>(null)

  async function load() {
    if (!sessionId) return
    try { setSession(await sessionsApi.session(Number(sessionId))); setError("") }
    catch (exception) { setError(getApiErrorMessage(exception)) }
  }
  useEffect(() => { void load() }, [sessionId])
  useEffect(() => {
    if (!isDgas || !sessionId) { setCapacityReport(null); return }
    affectationsApi.regionalCapacities(Number(sessionId))
      .then(setCapacityReport)
      .catch(() => setCapacityReport(null))
  }, [isDgas, sessionId])

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
  const afficheDatesInscription = ["VOLONTAIRE", "MIXTE"].includes(session.public_cible)
  const canEdit = ["brouillon", "ouverte", "en_preparation", "en_cours"].includes(session.statut)
  const canCancel = ["brouillon", "ouverte", "en_preparation", "en_cours"].includes(session.statut)

  return <>
    <PageHeader title={session.nom} description={`${session.code} · Promotion ${session.numero_promotion}`} backTo={isDgas ? "/app" : "/app/sessions"} />
    {error && <div className="mb-5"><ErrorBox message={error} /></div>}
    {closureBlocks.length > 0 && <Card className="mb-5 border-amber-300 bg-amber-50"><CardContent className="p-5"><div className="flex gap-3"><AlertTriangle className="mt-0.5 size-5 text-amber-700" /><div><h3 className="font-semibold text-amber-950">La session ne peut pas encore être terminée</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900">{closureBlocks.map((block, index) => <li key={index}>{block}</li>)}</ul></div></div></CardContent></Card>}

    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Statut</p><div className="mt-2"><SessionStatusBadge status={session.statut} /></div></CardContent></Card>
      <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Type et public</p><p className="mt-2 font-semibold">{SESSION_TYPE_LABELS[session.type_session]}</p><p className="text-sm text-muted-foreground">{PUBLIC_LABELS[session.public_cible]}</p></CardContent></Card>
      <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Période</p><p className="mt-2 font-semibold">{formatDate(session.date_debut)}</p><p className="text-sm text-muted-foreground">au {formatDate(session.date_fin)}</p></CardContent></Card>
      <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Mode d’entrée</p><p className="mt-2 font-semibold">{p ? MODE_LABELS[p.mode_entree] : "Non configuré"}</p></CardContent></Card>
    </section>

    {isDgas && <section className="mt-6 space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Vue opérationnelle DGAS</p>
        <h2 className="mt-1 text-2xl font-bold">Centres d’accueil et capacités régionales</h2>
      </div>
      {!p?.centres_accueil?.length ? <Card><CardContent className="p-6"><p className="font-semibold">Aucun centre d’accueil configuré</p><p className="mt-1 text-sm text-muted-foreground">L’Administration doit sélectionner les centres dans les paramètres de la session.</p></CardContent></Card> : <>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {[
            { label: "Centres d’accueil", value: p.centres_accueil.length, icon: Building2 },
            { label: "Régions d’accueil", value: capacityReport?.regions.length ?? "…", icon: MapPinned },
            { label: "Capacité ouverte", value: capacityReport?.capacite_totale ?? "…", icon: Gauge },
            { label: "Propositions en attente", value: capacityReport?.propositions_en_attente_total ?? "…", icon: AlertTriangle },
            { label: "Affectations validées", value: capacityReport?.affectations_validees_total ?? "…", icon: CheckCircle2 },
          ].map(({ label, value, icon: Icon }) => <Card key={label}><CardContent className="flex items-center gap-4 p-5"><span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></span><div><p className="text-sm text-muted-foreground">{label}</p><p className="text-2xl font-bold">{value}</p></div></CardContent></Card>)}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {(capacityReport?.regions ?? []).map((region) => (
            <Card key={region.region_id} className="overflow-hidden border-primary/15">
              <CardContent className="p-0">
                <div className="flex items-start justify-between gap-4 border-b bg-primary/[0.035] p-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <MapPinned className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-semibold">{region.region_nom}</h3>
                      <p className="text-sm text-muted-foreground">{region.nombre_centres} centre(s) pris en compte</p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                    {region.disponible} disponible(s)
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-px bg-border">
                  {[
                    ["Capacité régionale", region.capacite_ouverte],
                    ["Propositions", region.propositions_en_attente],
                    ["Validées", region.affectations_validees],
                    ["Places réservées", region.places_reservees],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="bg-card px-5 py-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                      <p className="mt-1 text-xl font-bold">{value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </>}
    </section>}

    {!isDgas && <div className="mt-6 flex flex-wrap gap-3">
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
    </div>}

    <section className={`mt-8 grid gap-6 xl:grid-cols-2 ${isDgas ? "" : ""}`}>
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="border-b bg-muted/25 px-6 py-5">
            <h2 className="text-xl font-semibold">Informations générales</h2>
            <p className="mt-1 text-sm text-muted-foreground">Repères administratifs de la session.</p>
          </div>
          <div className="p-6">
            <dl className="grid gap-3 sm:grid-cols-2">
              {[
                ["Année", session.annee],
                ["Promotion", session.numero_promotion],
                ...(afficheDatesInscription
                  ? [
                      ["Ouverture des inscriptions", formatDate(session.date_ouverture_inscription)],
                      ["Fermeture des inscriptions", formatDate(session.date_fermeture_inscription)],
                    ]
                  : []),
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-xl border bg-background px-4 py-3">
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
                  <dd className="mt-1 text-base font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 rounded-xl border bg-muted/15 px-4 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Description</p>
              <p className="mt-2 whitespace-pre-wrap leading-7">{session.description || "Aucune description."}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      {p ? <>
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="border-b bg-muted/25 px-6 py-5">
            <h2 className="text-xl font-semibold">Services prévus</h2>
            <p className="mt-1 text-sm text-muted-foreground">Fonctionnalités prévues pour cette session.</p>
          </div>
          <div className="p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                [p.hebergement_active, "Hébergement"],
                [p.repas_active, "Repas"],
                [p.visite_medicale_active, "Visite médicale"],
                [p.activites_active, "Activités"],
                [p.evaluation_active, "Évaluations"],
                [p.attestation_active, "Attestations"],
                [p.consultation_publique_active, "Consultation publique"],
              ].map(([active, label]) => (
                <div key={String(label)} className="flex items-center justify-between rounded-xl border px-4 py-3">
                  <span className="font-medium">{label}</span>
                  <Badge variant={active ? "default" : "secondary"}>{active ? "Activé" : "Désactivé"}</Badge>
                </div>
              ))}
            </div>
            {p.attestation_active && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-primary/[0.055] px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Présence minimale</p>
                  <p className="mt-1 text-xl font-bold">{p.taux_presence_minimum_attestation} %</p>
                </div>
                <div className="rounded-xl bg-primary/[0.055] px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Moyenne minimale</p>
                  <p className="mt-1 text-xl font-bold">{p.moyenne_minimum_attestation}/20</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      {!isDgas && <><Card><CardContent className="p-6"><h2 className="text-xl font-semibold">Directives et consignes</h2><div className="mt-5 space-y-5"><div><p className="text-sm text-muted-foreground">Directives générales</p><p className="mt-2 whitespace-pre-wrap leading-7">{p.directives_generales || "Aucune directive."}</p></div><div><p className="text-sm text-muted-foreground">Consignes générales</p><p className="mt-2 whitespace-pre-wrap leading-7">{p.consignes_generales || "Aucune consigne."}</p></div></div></CardContent></Card>
      <Card><CardContent className="p-6"><h2 className="flex items-center gap-2 text-xl font-semibold"><FileText className="size-5" />Documents exigés</h2>{p.documents_exiges.length === 0 ? <p className="mt-5 text-muted-foreground">Aucun document exigé.</p> : <ul className="mt-5 space-y-2">{p.documents_exiges.map((document, index) => <li key={`${document}-${index}`} className="rounded-xl border px-4 py-3">{document}</li>)}</ul>}</CardContent></Card></>}
      </> : <Card className="xl:col-span-2"><CardContent className="p-6"><h2 className="text-xl font-semibold">Organisation à compléter</h2><p className="mt-2 text-muted-foreground">La session est créée, mais ses services et ses règles d’organisation doivent encore être précisés avant de pouvoir l’ouvrir.</p></CardContent></Card>}
    </section>

    {session.statut === "annulee" && <Card className="mt-6 border-destructive/30"><CardContent className="p-6"><h2 className="text-xl font-semibold text-destructive">Session annulée</h2><p className="mt-2"><span className="font-medium">Motif :</span> {session.motif_annulation || "Non précisé"}</p><p className="mt-1 text-sm text-muted-foreground">Date : {formatDate(session.date_annulation)}</p></CardContent></Card>}
  </>
}
