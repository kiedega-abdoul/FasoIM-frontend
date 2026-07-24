import { useCallback, useEffect, useMemo, useState } from "react"
import { CheckCircle2, CircleAlert, FileCheck2, LoaderCircle, RefreshCw, RotateCcw, Send, Users } from "lucide-react"

import { getApiErrorMessage } from "@/api/api-error"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { EmptyState, ErrorBox, Loading, PageHeader } from "@/features/accounts/components"
import { currentScopeParams } from "@/features/affectations/scope"
import { useAuthStore } from "@/stores/auth-store"
import { documentsApi } from "../api"
import type { FinalResult, FinalResultStatistics, OfficialPublication, RegionalCertificateStatistics } from "../types"

const PAGE_SIZE = 50

function statusLabel(status: OfficialPublication["statut"]) {
  const labels: Record<OfficialPublication["statut"], string> = {
    BROUILLON: "En préparation",
    SOUMISE_REGION: "Transmis par le centre",
    A_CORRIGER: "À corriger",
    VALIDEE_REGION: "Validé",
    PRETE_DGAS: "Validé",
    PUBLIEE: "Publié",
    DEPUBLIEE: "Dépublié",
    REMPLACEE: "Remplacé",
    ANNULEE: "Annulé",
  }
  return labels[status]
}

function statusVariant(status: OfficialPublication["statut"]) {
  if (status === "PUBLIEE") return "default" as const
  if (status === "A_CORRIGER" || status === "ANNULEE") return "destructive" as const
  return "secondary" as const
}

export function RegionalCertificatesPage() {
  const assignment = useAuthStore((state) => state.context?.affectation_courante)
  const permissions = assignment?.permissions ?? []
  const scope = currentScopeParams() as Record<string, string | number | undefined>
  const sessionId = Number(scope.session_id || assignment?.session?.id || 0)

  const [statistics, setStatistics] = useState<RegionalCertificateStatistics | null>(null)
  const [publications, setPublications] = useState<OfficialPublication[]>([])
  const [selected, setSelected] = useState<OfficialPublication | null>(null)
  const [results, setResults] = useState<FinalResult[]>([])
  const [resultStats, setResultStats] = useState<FinalResultStatistics>({
    total: 0,
    eligibles: 0,
    non_eligibles: 0,
    a_verifier: 0,
    publies: 0,
  })
  const [resultPage, setResultPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [workingId, setWorkingId] = useState<number | null>(null)
  const [confirmPublication, setConfirmPublication] = useState<OfficialPublication | null>(null)
  const [rejectTarget, setRejectTarget] = useState<OfficialPublication | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")

  const canView = permissions.includes("consulter_publications")
  const canValidate = permissions.includes("valider_publication_region")
  const canReject = permissions.includes("rejeter_publication_region")

  const load = useCallback(async (refreshOnly = false) => {
    if (refreshOnly) setRefreshing(true)
    else setLoading(true)
    setError("")
    try {
      if (!sessionId) {
        setStatistics(null)
        setPublications([])
        return
      }
      const [stats, rows] = await Promise.all([
        documentsApi.regionalCertificateStatistics(sessionId),
        documentsApi.publications({ session: sessionId, type_publication: "ATTESTATIONS" }),
      ])
      setStatistics(stats)
      setPublications(rows.filter((row) => row.centre && !["REMPLACEE", "ANNULEE"].includes(row.statut)))
    } catch (exception) {
      setError(getApiErrorMessage(exception))
    } finally {
      if (refreshOnly) setRefreshing(false)
      else setLoading(false)
    }
  }, [sessionId])

  const loadPublicationDetails = useCallback(async (publication: OfficialPublication, page: number) => {
    if (!publication.centre) return
    setDetailsLoading(true)
    setError("")
    try {
      const [pageData, stats] = await Promise.all([
        documentsApi.finalResultsPage({
          session: sessionId,
          centre: publication.centre,
          page,
          page_size: PAGE_SIZE,
        }),
        documentsApi.finalResultStatistics({
          session: sessionId,
          centre: publication.centre,
        }),
      ])
      setResults(pageData.results)
      setResultStats(stats)
    } catch (exception) {
      setError(getApiErrorMessage(exception))
      setResults([])
    } finally {
      setDetailsLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [load])

  async function openPublication(publication: OfficialPublication) {
    setSelected(publication)
    setResultPage(1)
    await loadPublicationDetails(publication, 1)
  }

  async function changeResultPage(nextPage: number) {
    if (!selected) return
    const totalPages = Math.max(1, Math.ceil(resultStats.total / PAGE_SIZE))
    const safePage = Math.min(totalPages, Math.max(1, nextPage))
    setResultPage(safePage)
    await loadPublicationDetails(selected, safePage)
  }

  async function validatePublication(publication: OfficialPublication) {
    if (!canValidate) return
    setConfirmPublication(null)
    setWorkingId(publication.id)
    setError("")
    setInfo("")
    try {
      await documentsApi.validateRegionalCertificates(publication.id)
      setInfo("Les résultats et attestations du centre ont été validés, signés et publiés par le Directeur régional.")
      setSelected(null)
      setResults([])
      await load(true)
    } catch (exception) {
      setError(getApiErrorMessage(exception))
    } finally {
      setWorkingId(null)
    }
  }

  async function rejectPublication() {
    if (!canReject || !rejectTarget) return
    const reason = rejectReason.trim()
    if (!reason) {
      setError("Indiquez le motif de correction à transmettre au Responsable de centre.")
      return
    }
    const publication = rejectTarget
    setRejectTarget(null)
    setRejectReason("")
    setWorkingId(publication.id)
    setError("")
    setInfo("")
    try {
      await documentsApi.rejectRegionalCertificates(publication.id, reason)
      setInfo("Le dossier a été retourné au Responsable de centre pour correction.")
      setSelected(null)
      setResults([])
      await load(true)
    } catch (exception) {
      setError(getApiErrorMessage(exception))
    } finally {
      setWorkingId(null)
    }
  }

  const region = statistics?.regions[0]
  const totals = useMemo(() => ({
    centers: publications.length,
    pending: publications.filter((row) => row.statut === "SOUMISE_REGION").length,
    published: publications.filter((row) => row.statut === "PUBLIEE").length,
    availableCertificates: Math.max((region?.generees ?? 0) - (region?.publiees ?? 0), 0),
  }), [publications, region])

  const totalResultPages = Math.max(1, Math.ceil(resultStats.total / PAGE_SIZE))

  if (loading) return <Loading />

  return <div className="space-y-6">
    <PageHeader
      title="Résultats et attestations"
      description="Vérifiez les dossiers transmis par les centres de votre région, puis validez, signez et publiez les résultats. La DGAS est seulement informée."
      backTo="/app"
    />

    {error && <ErrorBox message={error} />}
    {info && <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm font-medium text-primary">{info}</div>}

    {!sessionId && <EmptyState message="Sélectionnez une affectation régionale active pour consulter les attestations." />}

    {sessionId && canView && <>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Centres suivis", value: totals.centers, icon: Users },
          { label: "À examiner", value: totals.pending, icon: CircleAlert },
          { label: "Attestations à publier", value: totals.availableCertificates, icon: FileCheck2 },
          { label: "Publiés", value: totals.published, icon: CheckCircle2 },
        ].map(({ label, value, icon: Icon }) => <Card key={label}><CardContent className="flex items-center gap-4 p-5"><span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></span><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div></CardContent></Card>)}
      </section>

      {region && <Card><CardContent className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-5">
        <div><p className="text-sm text-muted-foreground">Région</p><p className="font-semibold">{region.region_nom}</p></div>
        <div><p className="text-sm text-muted-foreground">Immergés</p><p className="font-semibold">{region.total_immerges}</p></div>
        <div><p className="text-sm text-muted-foreground">Éligibles</p><p className="font-semibold">{region.eligibles}</p></div>
        <div><p className="text-sm text-muted-foreground">Non éligibles</p><p className="font-semibold">{region.non_eligibles}</p></div>
        <div><p className="text-sm text-muted-foreground">À vérifier</p><p className="font-semibold">{region.a_verifier}</p></div>
      </CardContent></Card>}

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Dossiers des centres</p><h2 className="mt-1 text-2xl font-bold">Attestations transmises</h2></div>
          <Button type="button" variant="outline" disabled={refreshing} onClick={() => void load(true)}><RefreshCw className={`mr-2 size-4 ${refreshing ? "animate-spin" : ""}`} />{refreshing ? "Actualisation…" : "Actualiser"}</Button>
        </div>

        {publications.length === 0 ? <EmptyState message="Aucun centre n’a encore transmis de dossier d’attestations pour cette session." /> : <div className="grid gap-3">
          {publications.map((publication) => <Card key={publication.id}><CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-bold">{publication.centre_nom || "Centre"}</h3><Badge variant={statusVariant(publication.statut)}>{statusLabel(publication.statut)}</Badge></div>
              <p className="mt-1 text-sm text-muted-foreground">{publication.date_soumission ? `Transmis le ${new Date(publication.date_soumission).toLocaleDateString("fr-FR")}` : "Dossier non encore transmis"}</p>
              {publication.motif_correction && <p className="mt-2 text-sm text-destructive">Correction demandée : {publication.motif_correction}</p>}
            </div>
            <Button variant="outline" onClick={() => void openPublication(publication)}><FileCheck2 className="mr-2 size-4" />Examiner</Button>
          </CardContent></Card>)}
        </div>}
      </section>

      {selected && <section className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Dossier sélectionné</p><h2 className="mt-1 text-2xl font-bold">{selected.centre_nom || "Centre"}</h2></div>
          <Button variant="ghost" onClick={() => { setSelected(null); setResults([]) }}>Fermer</Button>
        </div>

        {detailsLoading ? <div className="flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" />Chargement des résultats…</div> : <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Résultats</p><p className="mt-1 text-xl font-bold">{resultStats.total}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Éligibles</p><p className="mt-1 text-xl font-bold">{resultStats.eligibles}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Non éligibles</p><p className="mt-1 text-xl font-bold">{resultStats.non_eligibles}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">À vérifier</p><p className="mt-1 text-xl font-bold">{resultStats.a_verifier}</p></CardContent></Card>
          </div>

          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-muted/60 text-left"><tr><th className="px-4 py-3">Immergé</th><th className="px-4 py-3">Présence</th><th className="px-4 py-3">Moyenne</th><th className="px-4 py-3">Décision</th><th className="px-4 py-3">Motif</th></tr></thead>
              <tbody>{results.map((result) => <tr key={result.id} className="border-t"><td className="px-4 py-3 font-medium">{result.code_fasoim}</td><td className="px-4 py-3">{result.taux_presence ?? "—"}{result.taux_presence != null ? " %" : ""}</td><td className="px-4 py-3">{result.evaluation_active ? (result.moyenne_sur_20 ?? "—") : "Non applicable"}</td><td className="px-4 py-3"><Badge variant={result.decision === "ELIGIBLE" ? "default" : result.decision === "NON_ELIGIBLE" ? "destructive" : "secondary"}>{result.decision_libelle}</Badge></td><td className="px-4 py-3 text-muted-foreground">{result.motifs?.join(", ") || "—"}</td></tr>)}</tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold">Page {resultPage} sur {totalResultPages} · {results.length} résultat(s) affiché(s)</p>
            <div className="flex gap-2">
              <Button variant="outline" disabled={detailsLoading || resultPage <= 1} onClick={() => void changeResultPage(resultPage - 1)}>Précédente</Button>
              <Button variant="outline" disabled={detailsLoading || resultPage >= totalResultPages} onClick={() => void changeResultPage(resultPage + 1)}>Suivante</Button>
            </div>
          </div>

          {selected.statut === "SOUMISE_REGION" && <div className="flex flex-wrap justify-end gap-3">
            {canReject && <Button variant="outline" disabled={workingId === selected.id} onClick={() => { setRejectReason(""); setRejectTarget(selected) }}><RotateCcw className="mr-2 size-4" />Retourner pour correction</Button>}
            {canValidate && <Button disabled={workingId === selected.id || resultStats.a_verifier > 0} onClick={() => setConfirmPublication(selected)}>{workingId === selected.id ? <LoaderCircle className="mr-2 size-4 animate-spin" /> : <Send className="mr-2 size-4" />}Valider, signer et publier</Button>}
          </div>}
        </>}
      </section>}
    </>}

    {sessionId && !canView && <EmptyState message="Votre affectation ne permet pas de consulter les publications régionales." />}

    <Dialog open={Boolean(confirmPublication)} onOpenChange={(open) => { if (!open && workingId === null) setConfirmPublication(null) }}>
      <DialogContent showCloseButton={false} className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Valider, signer et publier les attestations</DialogTitle>
          <DialogDescription>
            Le Directeur régional va signer et publier {resultStats.eligibles} attestation(s) du centre {confirmPublication?.centre_nom || "sélectionné"}. Cette action rend les attestations disponibles aux immergés. La DGAS sera seulement informée.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" disabled={workingId !== null} onClick={() => setConfirmPublication(null)}>Annuler</Button>
          <Button disabled={workingId !== null} onClick={() => { if (confirmPublication) void validatePublication(confirmPublication) }}>
            {workingId !== null && <LoaderCircle className="mr-2 size-4 animate-spin" />}
            Confirmer la publication
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={Boolean(rejectTarget)} onOpenChange={(open) => { if (!open && workingId === null) { setRejectTarget(null); setRejectReason("") } }}>
      <DialogContent showCloseButton={false} className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Retourner le dossier pour correction</DialogTitle>
          <DialogDescription>Le motif sera transmis au Responsable de centre. Il devra corriger puis soumettre à nouveau le dossier.</DialogDescription>
        </DialogHeader>
        <textarea
          className="min-h-32 w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          placeholder="Décrivez clairement la correction attendue…"
          value={rejectReason}
          onChange={(event) => setRejectReason(event.target.value)}
        />
        <DialogFooter>
          <Button variant="outline" disabled={workingId !== null} onClick={() => { setRejectTarget(null); setRejectReason("") }}>Annuler</Button>
          <Button variant="destructive" disabled={workingId !== null || !rejectReason.trim()} onClick={() => void rejectPublication()}>
            {workingId !== null && <LoaderCircle className="mr-2 size-4 animate-spin" />}
            Retourner pour correction
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
}
