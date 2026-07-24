import { useCallback, useEffect, useMemo, useState } from "react"
import { BedDouble, Building2, CheckCircle2, Layers3, LoaderCircle, RefreshCw, Search, Users, XCircle } from "lucide-react"
import { Link } from "react-router-dom"

import { getApiErrorMessage } from "@/api/api-error"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { currentScopeParams } from "@/features/affectations/scope"
import { EmptyState, ErrorBox, Loading, PageHeader, StatusBadge } from "@/features/accounts/components"
import { useAuthStore } from "@/stores/auth-store"
import { organisationApi } from "../api"
import { ORGANISATION_PERMISSIONS as P } from "../permissions"
import type { BedAssignment, CenterOrganizationRule, CenterOrganizationSummary, Group, GroupAssignment, OrganizationProgress, Section } from "../types"

type Tab = "structures" | "groupes" | "hebergement"

const OPEN_STATUSES = new Set(["PROPOSEE", "PROPOSE", "PROPOSED"])
const ACTIVE_STATUSES = new Set(["ACTIVE", "ACTIF", "VALIDEE", "VALIDE"])
const REJECTED_STATUSES = new Set(["REJETEE", "REJETE", "REJECTED"])
const CANCELLED_STATUSES = new Set(["ANNULEE", "ANNULE", "CANCELLED"])

function isProposed(status: string) {
  return OPEN_STATUSES.has(status.toUpperCase())
}

function isActive(status: string) {
  return ACTIVE_STATUSES.has(status.toUpperCase())
}

function matchesStatusFilter(status: string, filter: string) {
  if (filter === "TOUS") return true
  const normalized = status.toUpperCase()
  if (filter === "PROPOSEE") return OPEN_STATUSES.has(normalized)
  if (filter === "VALIDEE") return ACTIVE_STATUSES.has(normalized)
  if (filter === "REJETEE") return REJECTED_STATUSES.has(normalized)
  if (filter === "ANNULEE") return CANCELLED_STATUSES.has(normalized)
  return normalized === filter
}

export function InternalDistributionPage() {
  const assignment = useAuthStore((state) => state.context?.affectation_courante)
  const permissions = assignment?.permissions ?? []
  const scope = currentScopeParams() as Record<string, string | number | undefined>
  const sessionId = Number(scope.session_id || assignment?.session?.id || 0)
  const centerId = Number(scope.centre_id || assignment?.centre_id || 0)

  const [tab, setTab] = useState<Tab>("structures")
  const [rule, setRule] = useState<CenterOrganizationRule | null>(null)
  const [summary, setSummary] = useState<CenterOrganizationSummary | null>(null)
  const [sections, setSections] = useState<Section[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [groupAssignments, setGroupAssignments] = useState<GroupAssignment[]>([])
  const [bedAssignments, setBedAssignments] = useState<BedAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")
  const [progress, setProgress] = useState<OrganizationProgress | null>(null)
  const [groupProposalCount, setGroupProposalCount] = useState(100)
  const [bedProposalCount, setBedProposalCount] = useState(100)
  const [groupSearch, setGroupSearch] = useState("")
  const [groupStatus, setGroupStatus] = useState("PROPOSEE")
  const [bedSearch, setBedSearch] = useState("")
  const [bedStatus, setBedStatus] = useState("PROPOSEE")

  const canGenerate = permissions.includes(P.GENERATE_STRUCTURES)
  const canAssignGroups = permissions.includes(P.ASSIGN_GROUP)
  const canProposeBeds = permissions.includes(P.PROPOSE_BED)
  const canAssignBeds = permissions.includes(P.ASSIGN_BED)

  const refreshSummary = useCallback(async (ruleId: number) => {
    setSummary(await organisationApi.centerRuleSummary(ruleId))
  }, [])

  const refreshStructures = useCallback(async () => {
    const [sectionRows, groupRows] = await Promise.all([
      organisationApi.sections({ session_id: sessionId, centre_id: centerId }),
      organisationApi.groups({ session_id: sessionId, centre_id: centerId }),
    ])
    setSections(sectionRows)
    setGroups(groupRows)
  }, [centerId, sessionId])

  const refreshGroupAssignments = useCallback(async () => {
    setGroupAssignments(await organisationApi.groupAssignments({ session_id: sessionId, centre_id: centerId }))
  }, [centerId, sessionId])

  const refreshBedAssignments = useCallback(async () => {
    setBedAssignments(await organisationApi.bedAssignments({ session_id: sessionId, centre_id: centerId }))
  }, [centerId, sessionId])

  const load = useCallback(async (showInitialLoader = false) => {
    if (showInitialLoader) setLoading(true)
    setError("")
    try {
      if (!sessionId || !centerId) return
      const rules = await organisationApi.centerRules({ session_id: sessionId, centre_id: centerId })
      const currentRule = rules[0] ?? null
      setRule(currentRule)
      if (!currentRule) {
        setSummary(null)
        setSections([])
        setGroups([])
        setGroupAssignments([])
        setBedAssignments([])
        return
      }
      const [currentSummary, sectionRows, groupRows, groupAssignmentRows, bedAssignmentRows] = await Promise.all([
        organisationApi.centerRuleSummary(currentRule.id),
        organisationApi.sections({ session_id: sessionId, centre_id: centerId }),
        organisationApi.groups({ session_id: sessionId, centre_id: centerId }),
        organisationApi.groupAssignments({ session_id: sessionId, centre_id: centerId }),
        currentRule.hebergement_active
          ? organisationApi.bedAssignments({ session_id: sessionId, centre_id: centerId })
          : Promise.resolve([] as BedAssignment[]),
      ])
      setSummary(currentSummary)
      setSections(sectionRows)
      setGroups(groupRows)
      setGroupAssignments(groupAssignmentRows)
      setBedAssignments(bedAssignmentRows)
    } catch (exception) {
      setError(getApiErrorMessage(exception))
    } finally {
      if (showInitialLoader) setLoading(false)
    }
  }, [centerId, sessionId])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => { void load(true) }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [load])

  async function waitForTask(
    taskId: string,
    reader: (id: string) => Promise<OrganizationProgress>,
    successMessage: string,
    refreshAfterSuccess: () => Promise<void>,
  ) {
    for (let attempt = 0; attempt < 120; attempt += 1) {
      const current = await reader(taskId)
      setProgress(current)
      const status = current.statut.toUpperCase()
      if (["SUCCESS", "SUCCES", "TERMINEE", "TERMINE"].includes(status)) {
        setInfo(successMessage)
        setProgress(null)
        await refreshAfterSuccess()
        return
      }
      if (["FAILURE", "ECHEC", "ERREUR"].includes(status)) {
        throw new Error(current.message || "Le traitement a échoué.")
      }
      await new Promise((resolve) => window.setTimeout(resolve, 1200))
    }
    throw new Error("Le traitement prend plus de temps que prévu. Revenez dans quelques instants pour consulter son avancement.")
  }

  async function runTask(
    action: () => Promise<{ task_id: string }>,
    reader: (id: string) => Promise<OrganizationProgress>,
    message: string,
    refreshAfterSuccess: () => Promise<void>,
  ) {
    setWorking(true)
    setError("")
    setInfo("")
    setProgress(null)
    try {
      const launched = await action()
      await waitForTask(launched.task_id, reader, message, refreshAfterSuccess)
    } catch (exception) {
      setError(getApiErrorMessage(exception))
      setProgress(null)
    } finally {
      setWorking(false)
    }
  }

  const maxGroupProposalCount = Math.min(5000, summary?.candidats_groupes ?? 0)
  const maxBedProposalCount = Math.min(5000, summary?.candidats_lits ?? 0, summary?.lits_utilisables ?? 0)

  function normalizedProposalCount(value: number, maximum: number) {
    if (maximum <= 0) return 0
    return Math.max(1, Math.min(maximum, Math.trunc(value || 1)))
  }

  const proposedGroups = useMemo(() => groupAssignments.filter((item) => isProposed(item.statut)), [groupAssignments])
  const activeGroups = useMemo(() => groupAssignments.filter((item) => isActive(item.statut)), [groupAssignments])
  const proposedBeds = useMemo(() => bedAssignments.filter((item) => isProposed(item.statut)), [bedAssignments])
  const activeBeds = useMemo(() => bedAssignments.filter((item) => isActive(item.statut)), [bedAssignments])


  const filteredGroupAssignments = useMemo(() => {
    const query = groupSearch.trim().toLowerCase()
    return groupAssignments.filter((item) => {
      const statusMatches = matchesStatusFilter(item.statut, groupStatus)
      const text = [
        item.affectation_centre.code_fasoim,
        item.groupe.section.nom,
        item.groupe.nom,
        item.statut,
      ].filter(Boolean).join(" ").toLowerCase()
      return statusMatches && (!query || text.includes(query))
    })
  }, [groupAssignments, groupSearch, groupStatus])

  const filteredBedAssignments = useMemo(() => {
    const query = bedSearch.trim().toLowerCase()
    return bedAssignments.filter((item) => {
      const statusMatches = matchesStatusFilter(item.statut, bedStatus)
      const text = [
        item.affectation_centre.code_fasoim,
        item.lit.dortoir.nom,
        item.lit.numero_lit,
        item.statut,
      ].filter(Boolean).join(" ").toLowerCase()
      return statusMatches && (!query || text.includes(query))
    })
  }, [bedAssignments, bedSearch, bedStatus])

  const groupedStructures = useMemo(() => sections.map((section, sectionIndex) => ({
    section,
    target: summary?.plan_structures.sections[sectionIndex],
    groups: groups.filter((group) => group.section.id === section.id),
  })), [sections, groups, summary?.plan_structures.sections])

  if (loading) return <Loading />

  const centerName = rule?.centre?.nom || "votre centre"
  const sessionName = rule?.session?.nom || rule?.session?.code || assignment?.session?.nom || "la session courante"
  const total = summary?.total_affectations_centre ?? 0
  const completeGroups = summary?.affectations_groupes_actives ?? activeGroups.length
  const completeBeds = summary?.attributions_lits_actives ?? activeBeds.length
  const complete = total > 0 && completeGroups === total && (!rule?.hebergement_active || completeBeds === total)

  return <div className="space-y-6">
    <PageHeader
      title={`Répartition interne de ${centerName} pour ${sessionName}`}
      description="Créez les structures, répartissez les immergés dans les groupes et attribuez les lits lorsque l’hébergement est activé."
      backTo="/app"
    />

    {error && <ErrorBox message={error} />}
    {info && <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm text-primary">{info}</div>}

    {!rule ? <EmptyState message="Définissez d’abord l’organisation du centre avant de lancer la répartition interne des sections et des groupes." /> : <>
      <Card className="overflow-hidden border-primary/15 bg-gradient-to-br from-card to-primary/5">
        <CardContent className="grid gap-4 p-6 sm:grid-cols-2 xl:grid-cols-6">
          {[
            { label: "Immergés du centre", value: total, icon: Users },
            { label: "Sections", value: summary?.sections ?? sections.length, icon: Layers3 },
            { label: "Groupes", value: summary?.groupes ?? groups.length, icon: Users },
            { label: "Affectés aux groupes", value: `${completeGroups}/${total}`, icon: CheckCircle2 },
            { label: "Lits utilisables", value: summary?.lits_utilisables ?? 0, icon: BedDouble },
            { label: "Lits attribués", value: rule.hebergement_active ? `${completeBeds}/${total}` : "Non requis", icon: Building2 },
          ].map(({ label, value, icon: Icon }) => <div key={label} className="rounded-2xl border bg-background/80 p-4">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></span>
              <div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-xl font-bold">{value}</p></div>
            </div>
          </div>)}
        </CardContent>
      </Card>

      {progress && <Card><CardContent className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold">Traitement en cours</p>
            <p className="text-sm text-muted-foreground">{progress.message || progress.operation}</p>
          </div>
          <span className="text-lg font-bold text-primary">{progress.progression}%</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${progress.progression}%` }} /></div>
      </CardContent></Card>}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant={tab === "structures" ? "default" : "outline"} onClick={() => setTab("structures")}>Structures</Button>
        <Button type="button" variant={tab === "groupes" ? "default" : "outline"} onClick={() => setTab("groupes")}>Sections et groupes</Button>
        {rule.hebergement_active && <Button type="button" variant={tab === "hebergement" ? "default" : "outline"} onClick={() => setTab("hebergement")}>Dortoirs et lits</Button>}
      </div>

      {tab === "structures" && <div className="space-y-5">
        <Card><CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Étape 1</p>
            <h2 className="mt-1 text-2xl font-bold">Créer les structures</h2>
            <p className="mt-1 text-sm text-muted-foreground">Les sections et groupes sont calculés à partir des règles enregistrées dans Organisation du centre.</p>
          </div>
          <Button
            disabled={working || !canGenerate || !summary?.actions.peut_generer_structures}
            onClick={() => rule && void runTask(
              () => organisationApi.generateCenterStructures(rule.id),
              organisationApi.centerRuleProgress,
              "Sections et groupes créés.",
              async () => { await Promise.all([refreshSummary(rule.id), refreshStructures()]) },
            )}
          >{working ? <LoaderCircle className="mr-2 size-4 animate-spin" /> : <Layers3 className="mr-2 size-4" />}Générer les structures</Button>
        </CardContent></Card>

        {groupedStructures.length === 0 ? <EmptyState message="Aucune section ni aucun groupe n’a encore été créé." /> : <div className="grid gap-4 lg:grid-cols-2">
          {groupedStructures.map(({ section, target, groups: sectionGroups }) => <Card key={section.id}><CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-bold">{section.nom}</p>
                <p className="text-sm text-muted-foreground">Effectif cible : {target?.effectif_cible ?? "—"}</p>
                <p className="text-sm text-muted-foreground">Capacité maximale : {section.capacite_max}</p>
              </div>
              <StatusBadge value={section.statut.toLowerCase()} />
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {sectionGroups.map((group, groupIndex) => <div key={group.id} className="rounded-xl border bg-muted/20 p-3">
                <p className="font-semibold">{group.nom}</p>
                <p className="text-sm text-muted-foreground">Effectif cible : {target?.groupes[groupIndex]?.effectif_cible ?? "—"}</p>
                <p className="text-sm text-muted-foreground">Capacité maximale : {group.capacite_max}</p>
              </div>)}
            </div>
          </CardContent></Card>)}
        </div>}
      </div>}

      {tab === "groupes" && <div className="space-y-5">
        <Card><CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Étape 2</p>
            <h2 className="mt-1 text-2xl font-bold">Répartir les immergés dans les groupes</h2>
            <p className="mt-1 text-sm text-muted-foreground">Une proposition équilibrée est préparée pour que vous puissiez la contrôler avant validation.</p>
          </div>
          <div className="flex min-w-0 flex-col gap-3 lg:items-end">
            <div className="flex flex-wrap items-center gap-2">
              {[100, 250, 500, 1000].filter((value) => value <= maxGroupProposalCount).map((value) => (
                <Button key={value} type="button" size="sm" variant={groupProposalCount === value ? "default" : "outline"} onClick={() => setGroupProposalCount(value)}>{value}</Button>
              ))}
              {maxGroupProposalCount > 0 && <Button type="button" size="sm" variant={groupProposalCount === maxGroupProposalCount ? "default" : "outline"} onClick={() => setGroupProposalCount(maxGroupProposalCount)}>Tout le disponible ({maxGroupProposalCount})</Button>}
            </div>
            <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
              <Input
                className="h-10 min-w-40"
                type="number"
                min={1}
                max={maxGroupProposalCount || 1}
                value={groupProposalCount}
                disabled={working || maxGroupProposalCount === 0}
                onChange={(event) => setGroupProposalCount(Number(event.target.value))}
                onBlur={() => setGroupProposalCount(normalizedProposalCount(groupProposalCount, maxGroupProposalCount))}
                aria-label="Nombre d’immergés à proposer dans les groupes"
              />
              <Button variant="outline" disabled={working || !canAssignGroups || groups.length === 0 || maxGroupProposalCount === 0} onClick={() => void runTask(
                () => organisationApi.proposeGroupAssignments(sessionId, centerId, normalizedProposalCount(groupProposalCount, maxGroupProposalCount)),
                organisationApi.groupAssignmentProgress,
                "Propositions de groupes générées.",
                async () => { if (rule) await Promise.all([refreshSummary(rule.id), refreshGroupAssignments()]) },
              )}><RefreshCw className="mr-2 size-4" />Proposer {normalizedProposalCount(groupProposalCount, maxGroupProposalCount)} affectation(s)</Button>
              <Button disabled={working || !canAssignGroups || proposedGroups.length === 0} onClick={() => void runTask(
                () => organisationApi.validateGroupAssignments(proposedGroups.map((item) => item.id)),
                organisationApi.groupAssignmentProgress,
                "Répartition des groupes validée.",
                async () => { if (rule) await Promise.all([refreshSummary(rule.id), refreshGroupAssignments()]) },
              )}><CheckCircle2 className="mr-2 size-4" />Valider les propositions ({proposedGroups.length})</Button>
              <Button variant="destructive" disabled={working || !canAssignGroups || proposedGroups.length === 0} onClick={() => void runTask(
                () => organisationApi.rejectGroupAssignments(proposedGroups.map((item) => item.id)),
                organisationApi.groupAssignmentProgress,
                "Propositions de groupes rejetées.",
                async () => { if (rule) await Promise.all([refreshSummary(rule.id), refreshGroupAssignments()]) },
              )}><XCircle className="mr-2 size-4" />Rejeter ({proposedGroups.length})</Button>
            </div>
          </div>
        </CardContent></Card>

        {groupAssignments.length > 0 && <Card><CardContent className="flex flex-col gap-3 p-4">
          <div className="relative w-full md:max-w-2xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" value={groupSearch} onChange={(event) => setGroupSearch(event.target.value)} placeholder="Rechercher par Code FasoIM, section ou groupe" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">Statut :</span>
            {[
              ["TOUS", "Toutes"],
              ["PROPOSEE", "Proposées"],
              ["VALIDEE", "Validées"],
              ["REJETEE", "Rejetées"],
              ["ANNULEE", "Annulées"],
            ].map(([value, label]) => (
              <Button key={value} type="button" size="sm" variant={groupStatus === value ? "default" : "outline"} onClick={() => setGroupStatus(value)}>{label}</Button>
            ))}
            <Button type="button" size="sm" variant="outline" onClick={() => { setGroupSearch(""); setGroupStatus("PROPOSEE") }}>Réinitialiser</Button>
          </div>
        </CardContent></Card>}

        {groupAssignments.length === 0 ? <EmptyState message="Aucune proposition de groupe n’est disponible." /> : filteredGroupAssignments.length === 0 ? <EmptyState message="Aucune proposition de groupe ne correspond aux filtres actuels." /> : <Card><CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b bg-muted/30 text-left"><tr><th className="px-5 py-4">Code FasoIM</th><th className="px-5 py-4">Section</th><th className="px-5 py-4">Groupe</th><th className="px-5 py-4">Statut</th></tr></thead>
            <tbody>{filteredGroupAssignments.map((item) => <tr key={item.id} className="border-b last:border-0"><td className="px-5 py-4 font-medium">{item.affectation_centre.code_fasoim || `Immergé #${item.affectation_centre.immerge_id}`}</td><td className="px-5 py-4">{item.groupe.section.nom}</td><td className="px-5 py-4">{item.groupe.nom}</td><td className="px-5 py-4"><StatusBadge value={item.statut.toLowerCase()} /></td></tr>)}</tbody>
          </table>
        </CardContent></Card>}
      </div>}

      {tab === "hebergement" && rule.hebergement_active && <div className="space-y-5">
        <Card><CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Étape 3</p>
            <h2 className="mt-1 text-2xl font-bold">Attribuer les dortoirs et les lits</h2>
            <p className="mt-1 text-sm text-muted-foreground">Les propositions respectent le sexe des dortoirs et la disponibilité réelle des lits.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button render={<Link to="/app/dortoirs/nouveau" />}>Créer un dortoir</Button>
            <Button render={<Link to="/app/dortoirs" />} variant="outline">Gérer les dortoirs et générer les lits</Button>
            <Button render={<Link to="/app/lits" />} variant="outline">Gérer les lits</Button>
            {maxBedProposalCount > 0 && <>
              <Input
                className="h-10 w-32"
                type="number"
                min={1}
                max={maxBedProposalCount}
                value={bedProposalCount}
                disabled={working}
                onChange={(event) => setBedProposalCount(Number(event.target.value))}
                onBlur={() => setBedProposalCount(normalizedProposalCount(bedProposalCount, maxBedProposalCount))}
                aria-label="Nombre de lits à proposer"
              />
              <Button variant="outline" disabled={working || !canProposeBeds} onClick={() => void runTask(
                () => organisationApi.proposeBedAssignments(sessionId, centerId, normalizedProposalCount(bedProposalCount, maxBedProposalCount)),
                organisationApi.bedAssignmentProgress,
                "Propositions de lits générées.",
                async () => { if (rule) await Promise.all([refreshSummary(rule.id), refreshBedAssignments()]) },
              )}>Proposer {normalizedProposalCount(bedProposalCount, maxBedProposalCount)} lit(s)</Button>
            </>}
            <Button disabled={working || !canAssignBeds || proposedBeds.length === 0} onClick={() => void runTask(
              () => organisationApi.validateBedAssignments(proposedBeds.map((item) => item.id)),
              organisationApi.bedAssignmentProgress,
              "Attributions de lits validées.",
              async () => { if (rule) await Promise.all([refreshSummary(rule.id), refreshBedAssignments()]) },
            )}>Valider les propositions ({proposedBeds.length})</Button>
            <Button variant="destructive" disabled={working || !canAssignBeds || proposedBeds.length === 0} onClick={() => void runTask(
              () => organisationApi.rejectBedAssignments(proposedBeds.map((item) => item.id)),
              organisationApi.bedAssignmentProgress,
              "Propositions de lits rejetées.",
              async () => { if (rule) await Promise.all([refreshSummary(rule.id), refreshBedAssignments()]) },
            )}><XCircle className="mr-2 size-4" />Rejeter ({proposedBeds.length})</Button>
          </div>
        </CardContent></Card>

        {bedAssignments.length > 0 && <Card><CardContent className="flex flex-col gap-3 p-4">
          <div className="relative w-full md:max-w-2xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" value={bedSearch} onChange={(event) => setBedSearch(event.target.value)} placeholder="Rechercher par Code FasoIM, dortoir ou lit" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">Statut :</span>
            {[
              ["TOUS", "Toutes"],
              ["PROPOSEE", "Proposées"],
              ["VALIDEE", "Validées"],
              ["REJETEE", "Rejetées"],
              ["ANNULEE", "Annulées"],
            ].map(([value, label]) => (
              <Button key={value} type="button" size="sm" variant={bedStatus === value ? "default" : "outline"} onClick={() => setBedStatus(value)}>{label}</Button>
            ))}
            <Button type="button" size="sm" variant="outline" onClick={() => { setBedSearch(""); setBedStatus("PROPOSEE") }}>Réinitialiser</Button>
          </div>
        </CardContent></Card>}

        {(summary?.total_affectations_centre ?? 0) === 0 && <EmptyState message="Aucun immergé n’est encore affecté à ce centre pour cette session. Vous pouvez continuer à créer des dortoirs et à générer leurs lits." />}
        {(summary?.total_affectations_centre ?? 0) > 0 && (summary?.candidats_lits ?? 0) === 0 && <EmptyState message="Tous les immergés de ce centre disposent déjà d’un lit. Aucune nouvelle attribution n’est nécessaire." />}
        {(summary?.candidats_lits ?? 0) > 0 && (summary?.lits_utilisables ?? 0) === 0 && <EmptyState message="Des immergés attendent un lit, mais aucun lit utilisable n’est disponible. Créez un dortoir ou générez les lits manquants." />}
        {bedAssignments.length === 0 && (summary?.candidats_lits ?? 0) > 0 && (summary?.lits_utilisables ?? 0) > 0 && <EmptyState message="Aucune proposition de lit n’est encore disponible." />}
        {bedAssignments.length > 0 && filteredBedAssignments.length === 0 && <EmptyState message="Aucune proposition de lit ne correspond aux filtres actuels." />}
        {filteredBedAssignments.length > 0 && <Card><CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[820px] text-sm"><thead className="border-b bg-muted/30 text-left"><tr><th className="px-5 py-4">Code FasoIM</th><th className="px-5 py-4">Dortoir</th><th className="px-5 py-4">Lit</th><th className="px-5 py-4">Statut</th></tr></thead>
          <tbody>{filteredBedAssignments.map((item) => <tr key={item.id} className="border-b last:border-0"><td className="px-5 py-4 font-medium">{item.affectation_centre.code_fasoim || `Immergé #${item.affectation_centre.immerge_id}`}</td><td className="px-5 py-4">{item.lit.dortoir.nom}</td><td className="px-5 py-4">{item.lit.numero_lit}</td><td className="px-5 py-4"><StatusBadge value={item.statut.toLowerCase()} /></td></tr>)}</tbody></table>
        </CardContent></Card>}
      </div>}

      {complete && <Card className="border-primary/30 bg-primary/5"><CardContent className="flex items-center gap-4 p-6"><CheckCircle2 className="size-10 text-primary" /><div><p className="text-lg font-bold">Répartition interne complète</p><p className="text-sm text-muted-foreground">Tous les immergés disposent d’un groupe{rule.hebergement_active ? " et d’un lit" : ""}. Vous pouvez revenir dans Organisation du centre pour valider l’organisation.</p></div></CardContent></Card>}
    </>}
  </div>
}
