/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowRight,
  BedDouble,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  FileCheck2,
  Home,
  LoaderCircle,
  MapPin,
  ShieldCheck,
  Send,
  Users,
} from "lucide-react"
import { Link } from "react-router-dom"

import { getApiErrorMessage } from "@/api/api-error"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { currentScopeParams } from "@/features/affectations/scope"
import { documentsApi } from "@/features/documents/api"
import type { FinalResult, FinalResultStatistics, GeneratedDocument, OfficialPublication, TaskProgress } from "@/features/documents/types"
import { EmptyState, ErrorBox, Loading, PageHeader } from "@/features/accounts/components"
import { useAuthStore } from "@/stores/auth-store"
import { organisationApi } from "../api"
import { ORGANISATION_PERMISSIONS as P } from "../permissions"
import type { CenterOrganizationRule, CenterOrganizationSummary } from "../types"

type CheckItem = {
  label: string
  detail: string
  complete: boolean
  href?: string
}

function normalizedStatus(value?: string | null) {
  return (value || "").trim().toUpperCase()
}

export function CenterFinalizationPage() {
  const assignment = useAuthStore((state) => state.context?.affectation_courante)
  const permissions = assignment?.permissions ?? []
  const scope = currentScopeParams() as Record<string, string | number | undefined>
  const sessionId = Number(scope.session_id || assignment?.session?.id || 0)
  const centerId = Number(scope.centre_id || assignment?.centre_id || 0)

  const [rule, setRule] = useState<CenterOrganizationRule | null>(null)
  const [summary, setSummary] = useState<CenterOrganizationSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")
  const [, setResults] = useState<FinalResult[]>([])
  const [resultStatistics, setResultStatistics] = useState<FinalResultStatistics>({ total: 0, eligibles: 0, non_eligibles: 0, a_verifier: 0, publies: 0 })
  const [unvalidatedResults, setUnvalidatedResults] = useState(0)
  const [, setDocuments] = useState<GeneratedDocument[]>([])
  const [generatedCertificates, setGeneratedCertificates] = useState(0)
  const [publications, setPublications] = useState<OfficialPublication[]>([])
  const [completionWorking, setCompletionWorking] = useState(false)
  const [taskProgress, setTaskProgress] = useState<TaskProgress | null>(null)
  const [confirmation, setConfirmation] = useState<{ title: string; description: string } | null>(null)
  const confirmationResolver = useRef<((value: boolean) => void) | null>(null)

  function requestConfirmation(title: string, description: string) {
    setConfirmation({ title, description })
    return new Promise<boolean>((resolve) => { confirmationResolver.current = resolve })
  }

  function closeConfirmation(value: boolean) {
    confirmationResolver.current?.(value)
    confirmationResolver.current = null
    setConfirmation(null)
  }

  const canValidate = permissions.includes(P.VALIDATE_CENTER_ORGANIZATION)
  const canMarkReady = permissions.includes(P.MARK_CENTER_READY)
  const canCalculateResults = permissions.includes("calculer_resultats_finaux")
  const canValidateResults = permissions.includes("valider_resultats_centre")
  const canGenerateCertificates = permissions.includes("generer_attestations")
  const canSubmitCertificates = permissions.includes("soumettre_publication_centre")

  async function load(showLoader = true) {
    if (showLoader) setLoading(true)
    setError("")
    try {
      if (!sessionId || !centerId) {
        setRule(null)
        setSummary(null)
        return
      }
      const rules = await organisationApi.centerRules({ session_id: sessionId, centre_id: centerId })
      const currentRule = rules[0] ?? null
      setRule(currentRule)
      setSummary(currentRule ? await organisationApi.centerRuleSummary(currentRule.id) : null)
      if (normalizedStatus(currentRule?.statut) === "PRETE_PUBLICATION") {
        const [
          currentResultsPage,
          currentStatistics,
          calculatedResultsPage,
          generatedPage,
          signedPage,
          publishedPage,
          currentPublications,
        ] = await Promise.all([
          documentsApi.finalResultsPage({ session: sessionId, centre: centerId, page_size: 50 }),
          documentsApi.finalResultStatistics({ session: sessionId, centre: centerId }),
          documentsApi.finalResultsPage({ session: sessionId, centre: centerId, statut: "CALCULE", page_size: 1 }),
          documentsApi.generatedDocumentsPage({ session: sessionId, centre: centerId, type_document: "ATTESTATION", statut: "GENERE", page_size: 1 }),
          documentsApi.generatedDocumentsPage({ session: sessionId, centre: centerId, type_document: "ATTESTATION", statut: "SIGNE", page_size: 1 }),
          documentsApi.generatedDocumentsPage({ session: sessionId, centre: centerId, type_document: "ATTESTATION", statut: "PUBLIE", page_size: 1 }),
          documentsApi.publications({ session_id: sessionId, centre_id: centerId, type_publication: "ATTESTATIONS" }),
        ])
        setResults(currentResultsPage.results)
        setResultStatistics(currentStatistics)
        setUnvalidatedResults(calculatedResultsPage.count)
        setDocuments(generatedPage.results)
        setGeneratedCertificates(generatedPage.count + signedPage.count + publishedPage.count)
        setPublications(currentPublications)
      } else {
        setResults([])
        setResultStatistics({ total: 0, eligibles: 0, non_eligibles: 0, a_verifier: 0, publies: 0 })
        setUnvalidatedResults(0)
        setDocuments([])
        setGeneratedCertificates(0)
        setPublications([])
      }
    } catch (exception) {
      setError(getApiErrorMessage(exception))
    } finally {
      if (showLoader) setLoading(false)
    }
  }

  useEffect(() => { void load() }, [sessionId, centerId])

  async function validateOrganization() {
    if (!rule || !summary?.actions.peut_valider_organisation || !canValidate) return
    if (!await requestConfirmation("Valider l’organisation interne ?", "Les règles, sections, groupes, lits et affectations ont été vérifiés. Cette action validera officiellement l’organisation interne du centre.")) return

    setWorking(true)
    setError("")
    setInfo("")
    try {
      await organisationApi.validateCenterOrganization(rule.id)
      await load(false)
      setInfo("L’organisation interne du centre a été validée.")
    } catch (exception) {
      setError(getApiErrorMessage(exception))
    } finally {
      setWorking(false)
    }
  }

  async function markReady() {
    if (!rule || !summary?.actions.peut_marquer_pret || !canMarkReady) return
    if (!await requestConfirmation("Déclarer le centre prêt ?", "Le centre sera déclaré prêt à accueillir les immergés et les informations d’accueil pourront être publiées.")) return

    setWorking(true)
    setError("")
    setInfo("")
    try {
      await organisationApi.markCenterReady(rule.id)
      await load(false)
      setInfo("Le centre est prêt et les informations d’arrivée sont publiées pour ses immergés.")
    } catch (exception) {
      setError(getApiErrorMessage(exception))
    } finally {
      setWorking(false)
    }
  }


  async function waitForTask(taskId: string) {
    // Un centre de plusieurs milliers d’immergés peut nécessiter
    // plusieurs minutes. Le suivi reste actif pendant 15 minutes.
    for (let attempt = 0; attempt < 900; attempt += 1) {
      const progress = await documentsApi.taskProgress(taskId)
      setTaskProgress(progress)

      const statut = String(progress.statut || "").toUpperCase()

      if (
        ["TERMINE", "TERMINEE", "SUCCESS", "SUCCEEDED"].includes(
          statut,
        )
      ) {
        return progress
      }

      if (
        ["ECHEC", "ECHOUEE", "FAILED", "REFUSEE"].includes(
          statut,
        )
      ) {
        throw new Error(
          progress.erreur ||
            "Le traitement n’a pas pu être terminé.",
        )
      }

      await new Promise((resolve) =>
        window.setTimeout(resolve, 1000),
      )
    }

    throw new Error(
      "Le calcul continue en arrière-plan. Actualisez les données dans quelques instants.",
    )
  }

  async function calculateResults() {
    if (!canCalculateResults || !sessionId || !centerId) return
    if (!await requestConfirmation("Calculer les résultats finaux ?", "Toutes les opérations du centre seront vérifiées avant le calcul des résultats finaux.")) return
    setCompletionWorking(true)
    setTaskProgress({ statut: "EN_ATTENTE", progression: 0 })
    setError("")
    setInfo("")
    try {
      const task = await documentsApi.calculateCenter(sessionId, centerId)
      await waitForTask(task.task_id)
      await load(false)
      setInfo("Les opérations du centre ont été vérifiées et les résultats finaux ont été calculés.")
    } catch (exception) {
      setError(getApiErrorMessage(exception))
    } finally {
      setCompletionWorking(false)
    }
  }

  async function validateResults() {
    if (!canValidateResults || !sessionId || !centerId) return
    if (!await requestConfirmation("Valider les résultats finaux ?", "Les résultats finaux de tous les immergés du centre seront confirmés.")) return
    setCompletionWorking(true)
    setError("")
    setInfo("")
    try {
      await documentsApi.validateCenter(sessionId, centerId)
      await load(false)
      setInfo("Les résultats finaux du centre ont été validés.")
    } catch (exception) {
      setError(getApiErrorMessage(exception))
    } finally {
      setCompletionWorking(false)
    }
  }

  async function generateCertificates() {
    if (!canGenerateCertificates || !sessionId || !centerId) return
    setCompletionWorking(true)
    setTaskProgress({ statut: "EN_ATTENTE", progression: 0 })
    setError("")
    setInfo("")
    try {
      const task = await documentsApi.generateCertificates(sessionId, centerId)
      await waitForTask(task.task_id)
      await load(false)
      setInfo("Les attestations des immergés éligibles ont été préparées.")
    } catch (exception) {
      setError(getApiErrorMessage(exception))
    } finally {
      setCompletionWorking(false)
    }
  }

  async function submitCertificates() {
    if (!canSubmitCertificates || !sessionId || !centerId) return
    if (!await requestConfirmation("Finaliser et transmettre le dossier ?", "L’immersion du centre sera finalisée et les attestations seront transmises à la Direction régionale.")) return
    setCompletionWorking(true)
    setError("")
    setInfo("")
    try {
      const publication = await documentsApi.submitCertificates(sessionId, centerId)
      await load(false)
      const litsLiberes = publication.resume?.hebergement?.lits_liberes ?? 0
      setInfo(
        litsLiberes > 0
          ? `L’immersion du centre est finalisée, ${litsLiberes} lit(s) ont été libérés et le dossier a été transmis à la Direction régionale.`
          : "L’immersion du centre est finalisée et le dossier a été transmis à la Direction régionale."
      )
    } catch (exception) {
      setError(getApiErrorMessage(exception))
    } finally {
      setCompletionWorking(false)
    }
  }

  const status = normalizedStatus(rule?.statut)
  const isReady = status === "PRETE_PUBLICATION"
  const isValidated = status === "VALIDEE"
  const total = summary?.total_affectations_centre ?? 0
  const grouped = summary?.affectations_groupes_actives ?? 0
  const housed = summary?.attributions_lits_actives ?? 0
  const resultsCalculatedCount = resultStatistics.total
  const eligibleResultsCount = resultStatistics.eligibles
  const resultsCalculated = total > 0 && resultsCalculatedCount === total
  const resultsToReview = resultStatistics.a_verifier
  const resultsValidated = resultsCalculated && unvalidatedResults === 0
  const certificatesReady = resultsValidated && generatedCertificates === eligibleResultsCount
  const certificatePublication = publications.find((publication) => publication.type_publication === "ATTESTATIONS" && !["ANNULEE", "REMPLACEE"].includes(publication.statut))
  const completionSubmitted = Boolean(certificatePublication && ["SOUMISE_REGION", "VALIDEE_REGION", "PRETE_DGAS", "PUBLIEE"].includes(certificatePublication.statut))
  const releasedBeds = certificatePublication?.resume?.hebergement?.lits_liberes ?? 0

  const checks = useMemo<CheckItem[]>(() => {
    if (!rule || !summary) return []
    return [
      {
        label: "Règles du centre enregistrées",
        detail: "Les capacités, seuils et consignes d’accueil sont configurés.",
        complete: true,
        href: "/app/organisation-centre",
      },
      {
        label: "Sections et groupes créés",
        detail: `${summary.sections} section(s) et ${summary.groupes} groupe(s) disponibles.`,
        complete: summary.sections > 0 && summary.groupes > 0,
        href: "/app/repartition-interne",
      },
      {
        label: "Immergés répartis dans les groupes",
        detail: `${grouped}/${total} immergé(s) possèdent une affectation de groupe active.`,
        complete: total > 0 && grouped === total && summary.propositions_groupes === 0 && summary.candidats_groupes === 0,
        href: "/app/repartition-interne",
      },
      {
        label: "Hébergement préparé",
        detail: rule.hebergement_active
          ? `${housed}/${total} immergé(s) possèdent une attribution de lit active.`
          : "L’hébergement n’est pas requis pour cette session.",
        complete: !rule.hebergement_active
          || (total > 0 && housed === total && summary.propositions_lits === 0 && summary.candidats_lits === 0),
        href: rule.hebergement_active ? "/app/repartition-interne" : undefined,
      },
      {
        label: "Informations d’accueil renseignées",
        detail: rule.lieu_accueil
          ? `${rule.lieu_accueil}${rule.heure_accueil ? ` — ${rule.heure_accueil}` : ""}`
          : "Le lieu d’accueil doit être renseigné dans l’organisation du centre.",
        complete: Boolean(rule.lieu_accueil),
        href: "/app/organisation-centre",
      },
      {
        label: "Aucune proposition en attente",
        detail: `${summary.propositions_groupes} proposition(s) de groupe et ${summary.propositions_lits} proposition(s) de lit en attente.`,
        complete: summary.propositions_groupes === 0 && summary.propositions_lits === 0,
        href: "/app/repartition-interne",
      },
    ]
  }, [grouped, housed, rule, summary, total])

  if (loading) return <Loading />

  const centerName = rule?.centre?.nom || "votre centre"
  const sessionName = rule?.session?.nom || rule?.session?.code || assignment?.session?.nom || assignment?.session?.code || "la session courante"
  const completedChecks = checks.filter((item) => item.complete).length

  return <div className="space-y-6">
    <PageHeader
      title={`Finalisation du centre ${centerName}`}
      description={`Première finalisation avant l’accueil des immergés — ${sessionName}.`}
      backTo="/app"
    />

    {error && <ErrorBox message={error} />}
    {info && <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm font-medium text-primary">{info}</div>}

    {(!sessionId || !centerId) && <EmptyState message="Cette opération nécessite une affectation active à un centre pour la session en cours." />}

    {sessionId && centerId && !rule && <Card>
      <CardContent className="flex flex-col items-start gap-4 p-6">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><CircleAlert className="size-6" /></div>
        <div>
          <h2 className="text-xl font-bold">Organisation non configurée</h2>
          <p className="mt-1 text-sm text-muted-foreground">Enregistrez d’abord les règles et les informations d’accueil du centre.</p>
        </div>
        <Link className={buttonVariants()} to="/app/organisation-centre">Configurer l’organisation <ArrowRight className="ml-2 size-4" /></Link>
      </CardContent>
    </Card>}

    {rule && summary && isReady && <section className="overflow-hidden rounded-3xl border border-primary/20 bg-primary px-6 py-14 text-center text-primary-foreground shadow-xl sm:px-10 sm:py-20">
      <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-primary-foreground/15"><ShieldCheck className="size-11" /></div>
      <p className="mt-7 text-sm font-bold uppercase tracking-[0.35em] text-primary-foreground/80">Informations d’arrivée publiées</p>
      <h1 className="mt-4 text-4xl font-black uppercase leading-none tracking-tight sm:text-6xl lg:text-7xl">Centre prêt à accueillir les immergés</h1>
      <p className="mx-auto mt-6 max-w-3xl text-lg leading-7 text-primary-foreground/85">
        La préparation de {centerName} est finalisée pour {sessionName}. Les informations d’arrivée et d’organisation sont maintenant publiées et consultables par les immergés affectés à ce centre.
      </p>
    </section>}

    {rule && summary && !isReady && <>
      <Card className="overflow-hidden border-primary/15 bg-gradient-to-br from-card to-primary/5">
        <CardContent className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Immergés du centre", value: total, icon: Users },
            { label: "Affectés aux groupes", value: `${grouped}/${total}`, icon: ClipboardCheck },
            { label: "Hébergement", value: rule.hebergement_active ? `${housed}/${total}` : "Non requis", icon: BedDouble },
            { label: "Contrôles conformes", value: `${completedChecks}/${checks.length}`, icon: CheckCircle2 },
          ].map(({ label, value, icon: Icon }) => <div key={label} className="rounded-2xl border bg-background/80 p-4">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></span>
            <p className="mt-3 text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
          </div>)}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Première finalisation</p>
              <h2 className="mt-1 text-2xl font-bold">Préparation avant l’accueil</h2>
              <p className="mt-1 text-sm text-muted-foreground">L’état de préparation du centre est vérifié automatiquement à partir des informations enregistrées.</p>
            </div>
            <Badge variant={isValidated ? "default" : "secondary"}>{isValidated ? "Organisation validée" : "Préparation en cours"}</Badge>
          </div>

          <div className="mt-6 space-y-3">
            {checks.map((item) => <div key={item.label} className="flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                <span className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full ${item.complete ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {item.complete ? <CheckCircle2 className="size-5" /> : <CircleAlert className="size-5" />}
                </span>
                <div>
                  <p className="font-semibold">{item.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                </div>
              </div>
              {item.href && !item.complete && <Link className={buttonVariants({ variant: "outline", size: "sm" })} to={item.href}>Corriger <ArrowRight className="ml-2 size-4" /></Link>}
            </div>)}
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20">
        <CardContent className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              {isValidated ? <Home className="size-6" /> : <MapPin className="size-6" />}
            </span>
            <div>
              <h3 className="text-lg font-bold">{isValidated ? "Déclarer le centre prêt à accueillir" : "Valider l’organisation interne"}</h3>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                {isValidated
                  ? "Cette action confirme officiellement que le centre est entièrement prêt à accueillir les immergés."
                  : "Les groupes, les lits et les répartitions sont vérifiés automatiquement avant la validation."}
              </p>
            </div>
          </div>

          {!isValidated ? <Button
            type="button"
            size="lg"
            disabled={working || !canValidate || !summary.actions.peut_valider_organisation}
            onClick={() => void validateOrganization()}
          >
            {working && <LoaderCircle className="mr-2 size-4 animate-spin" />}
            Valider l’organisation
          </Button> : <Button
            type="button"
            size="lg"
            disabled={working || !canMarkReady || !summary.actions.peut_marquer_pret}
            onClick={() => void markReady()}
          >
            {working && <LoaderCircle className="mr-2 size-4 animate-spin" />}
            Déclarer le centre prêt
          </Button>}
        </CardContent>
      </Card>

      {!isValidated && !summary.actions.peut_valider_organisation && <div className="rounded-xl border border-amber-300/50 bg-amber-50 p-4 text-sm text-amber-950 dark:bg-amber-950/20 dark:text-amber-100">
        La validation n’est pas encore possible. Terminez les répartitions ou corrigez les éléments signalés ci-dessus.
      </div>}
    </>}

    {rule && summary && isReady && <Card className="overflow-hidden border-primary/20">
      <CardContent className="p-0">
        <div className="border-b bg-muted/30 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Deuxième finalisation</p>
              <h2 className="mt-1 text-2xl font-bold">Fin de l’immersion au centre</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
                Cette étape devient possible lorsque les séances, les présences, les évaluations, la santé, les kits et les autres opérations activées sont entièrement terminés.
              </p>
            </div>
            <Badge variant={completionSubmitted ? "default" : "secondary"}>
              {completionSubmitted ? "Transmis à la Direction régionale" : "Immersion en cours"}
            </Badge>
          </div>
        </div>

        {completionSubmitted ? <div className="p-8 text-center sm:p-12">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary"><ShieldCheck className="size-8" /></div>
          <h3 className="mt-5 text-3xl font-black uppercase tracking-tight">Immersion du centre finalisée</h3>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Les résultats et les attestations ont été transmis à la Direction régionale. Le centre peut désormais suivre leur traitement.
          </p>
          {releasedBeds > 0 && <div className="mx-auto mt-6 max-w-md rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm text-muted-foreground">Hébergement clôturé</p>
            <p className="mt-1 text-2xl font-bold text-primary">{releasedBeds} lit(s) libéré(s)</p>
            <p className="mt-1 text-sm text-muted-foreground">Ces lits pourront être réutilisés lors d’une prochaine session.</p>
          </div>}
        </div> : <div className="space-y-5 p-6">
          <div className="grid gap-3 lg:grid-cols-4">
            {[
              { label: "Résultats calculés", value: `${resultsCalculatedCount}/${total}`, complete: resultsCalculated },
              { label: "Résultats à vérifier", value: resultsToReview, complete: resultsCalculated && resultsToReview === 0 },
              { label: "Résultats validés", value: resultsValidated ? "Oui" : "Non", complete: resultsValidated },
              { label: "Attestations préparées", value: `${generatedCertificates}/${eligibleResultsCount}`, complete: certificatesReady },
            ].map((item) => <div key={item.label} className="rounded-2xl border p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">{item.label}</p>
                {item.complete ? <CheckCircle2 className="size-5 text-primary" /> : <CircleAlert className="size-5 text-muted-foreground" />}
              </div>
              <p className="mt-2 text-2xl font-bold">{item.value}</p>
            </div>)}
          </div>

          {taskProgress && completionWorking && <div className="rounded-2xl border bg-muted/30 p-4">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="font-medium">Traitement en cours</span>
              <span>{taskProgress.progression ?? 0}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-primary/10">
              <div className="h-full bg-primary transition-all" style={{ width: `${taskProgress.progression ?? 0}%` }} />
            </div>
          </div>}

          <div className="space-y-3">
            <div className="flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><ClipboardCheck className="size-5" /></span>
                <div><h3 className="font-bold">1. Vérifier et calculer les résultats</h3><p className="mt-1 text-sm text-muted-foreground">Toutes les opérations obligatoires du centre sont contrôlées avant le calcul.</p></div>
              </div>
              <Button type="button" disabled={completionWorking || !canCalculateResults || resultsValidated} onClick={() => void calculateResults()}>
                {completionWorking && !resultsCalculated && <LoaderCircle className="mr-2 size-4 animate-spin" />}Vérifier et calculer
              </Button>
            </div>

            <div className="flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><FileCheck2 className="size-5" /></span>
                <div><h3 className="font-bold">2. Valider les résultats du centre</h3><p className="mt-1 text-sm text-muted-foreground">La validation est possible lorsque tous les résultats existent et qu’aucun dossier ne reste à vérifier.</p></div>
              </div>
              <Button type="button" disabled={completionWorking || !canValidateResults || !resultsCalculated || resultsToReview > 0 || resultsValidated} onClick={() => void validateResults()}>
                Valider les résultats
              </Button>
            </div>

            <div className="flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><FileCheck2 className="size-5" /></span>
                <div><h3 className="font-bold">3. Préparer les attestations</h3><p className="mt-1 text-sm text-muted-foreground">Les attestations sont préparées uniquement pour les immergés déclarés éligibles.</p></div>
              </div>
              <Button type="button" disabled={completionWorking || !canGenerateCertificates || !resultsValidated || certificatesReady} onClick={() => void generateCertificates()}>
                Préparer les attestations
              </Button>
            </div>

            <div className="flex flex-col gap-4 rounded-2xl border border-primary/25 bg-primary/5 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Send className="size-5" /></span>
                <div><h3 className="font-bold">4. Finaliser et transmettre</h3><p className="mt-1 text-sm text-muted-foreground">Cette action termine les opérations du centre, libère les lits occupés et transmet le dossier à la Direction régionale.</p></div>
              </div>
              <Button type="button" size="lg" disabled={completionWorking || !canSubmitCertificates || !certificatesReady} onClick={() => void submitCertificates()}>
                Finaliser l’immersion
              </Button>
            </div>
          </div>
        </div>}
      </CardContent>
    </Card>}
    <Dialog open={Boolean(confirmation)} onOpenChange={(open) => { if (!open) closeConfirmation(false) }}>
    <DialogContent showCloseButton={false} className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{confirmation?.title}</DialogTitle>
        <DialogDescription>{confirmation?.description}</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => closeConfirmation(false)}>Annuler</Button>
        <Button type="button" onClick={() => closeConfirmation(true)}>Confirmer</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</div>
}
