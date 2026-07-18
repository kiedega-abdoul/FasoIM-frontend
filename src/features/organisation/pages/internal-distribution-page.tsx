import { useCallback, useEffect, useMemo, useState } from "react"
import { BedDouble, Building2, CheckCircle2, Layers3, LoaderCircle, RefreshCw, Users } from "lucide-react"
import { Link } from "react-router-dom"

import { getApiErrorMessage } from "@/api/api-error"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { currentScopeParams } from "@/features/affectations/scope"
import { EmptyState, ErrorBox, Loading, PageHeader, StatusBadge } from "@/features/accounts/components"
import { useAuthStore } from "@/stores/auth-store"
import { organisationApi } from "../api"
import { ORGANISATION_PERMISSIONS as P } from "../permissions"
import type { BedAssignment, CenterOrganizationRule, CenterOrganizationSummary, Group, GroupAssignment, OrganizationProgress, Section } from "../types"

type Tab = "structures" | "groupes" | "hebergement"

const OPEN_STATUSES = new Set(["PROPOSEE", "PROPOSE", "PROPOSED"])
const ACTIVE_STATUSES = new Set(["ACTIVE", "ACTIF", "VALIDEE", "VALIDE"])

function isProposed(status: string) {
  return OPEN_STATUSES.has(status.toUpperCase())
}

function isActive(status: string) {
  return ACTIVE_STATUSES.has(status.toUpperCase())
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

  const canGenerate = permissions.includes(P.GENERATE_STRUCTURES)
  const canAssignGroups = permissions.includes(P.ASSIGN_GROUP)
  const canProposeBeds = permissions.includes(P.PROPOSE_BED)
  const canAssignBeds = permissions.includes(P.ASSIGN_BED)

  const load = useCallback(async () => {
    setLoading(true)
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
      const [currentSummary, sectionRows, groupRows, groupAssignmentRows] = await Promise.all([
        organisationApi.centerRuleSummary(currentRule.id),
        organisationApi.sections({ session_id: sessionId, centre_id: centerId }),
        organisationApi.groups({ session_id: sessionId, centre_id: centerId }),
        organisationApi.groupAssignments({ session_id: sessionId, centre_id: centerId }),
      ])
      setSummary(currentSummary)
      setSections(sectionRows)
      setGroups(groupRows)
      setGroupAssignments(groupAssignmentRows)
      if (currentRule.hebergement_active) {
        setBedAssignments(await organisationApi.bedAssignments({ session_id: sessionId, centre_id: centerId }))
      } else {
        setBedAssignments([])
      }
    } catch (exception) {
      setError(getApiErrorMessage(exception))
    } finally {
      setLoading(false)
    }
  }, [centerId, sessionId])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [load])

  async function waitForTask(
    taskId: string,
    reader: (id: string) => Promise<OrganizationProgress>,
    successMessage: string,
  ) {
    for (let attempt = 0; attempt < 120; attempt += 1) {
      const current = await reader(taskId)
      setProgress(current)
      const status = current.statut.toUpperCase()
      if (["SUCCESS", "SUCCES", "TERMINEE", "TERMINE"].includes(status)) {
        setInfo(successMessage)
        await load()
        return
      }
      if (["FAILURE", "ECHEC", "ERREUR"].includes(status)) {
        throw new Error(current.message || "Le traitement a échoué.")
      }
      await new Promise((resolve) => window.setTimeout(resolve, 1200))
    }
    throw new Error("Le traitement prend plus de temps que prévu. Revenez dans quelques instants pour consulter son avancement.")
  }

  async function runTask(action: () => Promise<{ task_id: string }>, reader: (id: string) => Promise<OrganizationProgress>, message: string) {
    setWorking(true)
    setError("")
    setInfo("")
    setProgress(null)
    try {
      const launched = await action()
      await waitForTask(launched.task_id, reader, message)
    } catch (exception) {
      setError(getApiErrorMessage(exception))
    } finally {
      setWorking(false)
    }
  }

  const proposedGroups = useMemo(() => groupAssignments.filter((item) => isProposed(item.statut)), [groupAssignments])
  const activeGroups = useMemo(() => groupAssignments.filter((item) => isActive(item.statut)), [groupAssignments])
  const proposedBeds = useMemo(() => bedAssignments.filter((item) => isProposed(item.statut)), [bedAssignments])
  const activeBeds = useMemo(() => bedAssignments.filter((item) => isActive(item.statut)), [bedAssignments])

  const groupedStructures = useMemo(() => sections.map((section) => ({
    section,
    groups: groups.filter((group) => group.section.id === section.id),
  })), [sections, groups])

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

    {!rule ? <EmptyState message="Configurez d’abord l’organisation du centre avant de lancer la répartition interne." /> : <>
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
            )}
          >{working ? <LoaderCircle className="mr-2 size-4 animate-spin" /> : <Layers3 className="mr-2 size-4" />}Générer les structures</Button>
        </CardContent></Card>

        {groupedStructures.length === 0 ? <EmptyState message="Aucune section ni aucun groupe n’a encore été créé." /> : <div className="grid gap-4 lg:grid-cols-2">
          {groupedStructures.map(({ section, groups: sectionGroups }) => <Card key={section.id}><CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-lg font-bold">{section.nom}</p><p className="text-sm text-muted-foreground">Capacité maximale : {section.capacite_max}</p></div>
              <StatusBadge value={section.statut.toLowerCase()} />
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {sectionGroups.map((group) => <div key={group.id} className="rounded-xl border bg-muted/20 p-3">
                <p className="font-semibold">{group.nom}</p>
                <p className="text-sm text-muted-foreground">Capacité : {group.capacite_max}</p>
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
            <p className="mt-1 text-sm text-muted-foreground">Le système prépare une proposition équilibrée que vous contrôlez avant validation.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" disabled={working || !canAssignGroups || groups.length === 0 || (summary?.candidats_groupes ?? 0) === 0} onClick={() => void runTask(
              () => organisationApi.proposeGroupAssignments(sessionId, centerId),
              organisationApi.groupAssignmentProgress,
              "Propositions de groupes générées.",
            )}><RefreshCw className="mr-2 size-4" />Proposer la répartition</Button>
            <Button disabled={working || !canAssignGroups || proposedGroups.length === 0} onClick={() => void runTask(
              () => organisationApi.validateGroupAssignments(proposedGroups.map((item) => item.id)),
              organisationApi.groupAssignmentProgress,
              "Répartition des groupes validée.",
            )}><CheckCircle2 className="mr-2 size-4" />Valider les propositions ({proposedGroups.length})</Button>
          </div>
        </CardContent></Card>

        {groupAssignments.length === 0 ? <EmptyState message="Aucune proposition de groupe n’est disponible." /> : <Card><CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b bg-muted/30 text-left"><tr><th className="px-5 py-4">Code FasoIM</th><th className="px-5 py-4">Section</th><th className="px-5 py-4">Groupe</th><th className="px-5 py-4">Statut</th></tr></thead>
            <tbody>{groupAssignments.map((item) => <tr key={item.id} className="border-b last:border-0"><td className="px-5 py-4 font-medium">{item.affectation_centre.code_fasoim || `Immergé #${item.affectation_centre.immerge_id}`}</td><td className="px-5 py-4">{item.groupe.section.nom}</td><td className="px-5 py-4">{item.groupe.nom}</td><td className="px-5 py-4"><StatusBadge value={item.statut.toLowerCase()} /></td></tr>)}</tbody>
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
            <Button render={<Link to="/app/dortoirs" />} variant="outline">Gérer les dortoirs</Button>
            <Button render={<Link to="/app/lits" />} variant="outline">Gérer les lits</Button>
            <Button variant="outline" disabled={working || !canProposeBeds || (summary?.candidats_lits ?? 0) === 0 || (summary?.lits_utilisables ?? 0) === 0} onClick={() => void runTask(
              () => organisationApi.proposeBedAssignments(sessionId, centerId),
              organisationApi.bedAssignmentProgress,
              "Propositions de lits générées.",
            )}>Proposer les lits</Button>
            <Button disabled={working || !canAssignBeds || proposedBeds.length === 0} onClick={() => void runTask(
              () => organisationApi.validateBedAssignments(proposedBeds.map((item) => item.id)),
              organisationApi.bedAssignmentProgress,
              "Attributions de lits validées.",
            )}>Valider les propositions ({proposedBeds.length})</Button>
          </div>
        </CardContent></Card>

        {bedAssignments.length === 0 ? <EmptyState message="Aucune proposition de lit n’est disponible." /> : <Card><CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[820px] text-sm"><thead className="border-b bg-muted/30 text-left"><tr><th className="px-5 py-4">Code FasoIM</th><th className="px-5 py-4">Dortoir</th><th className="px-5 py-4">Lit</th><th className="px-5 py-4">Statut</th></tr></thead>
          <tbody>{bedAssignments.map((item) => <tr key={item.id} className="border-b last:border-0"><td className="px-5 py-4 font-medium">{item.affectation_centre.code_fasoim || `Immergé #${item.affectation_centre.immerge_id}`}</td><td className="px-5 py-4">{item.lit.dortoir.nom}</td><td className="px-5 py-4">{item.lit.numero_lit}</td><td className="px-5 py-4"><StatusBadge value={item.statut.toLowerCase()} /></td></tr>)}</tbody></table>
        </CardContent></Card>}
      </div>}

      {complete && <Card className="border-primary/30 bg-primary/5"><CardContent className="flex items-center gap-4 p-6"><CheckCircle2 className="size-10 text-primary" /><div><p className="text-lg font-bold">Répartition interne complète</p><p className="text-sm text-muted-foreground">Tous les immergés disposent d’un groupe{rule.hebergement_active ? " et d’un lit" : ""}. Vous pouvez revenir dans Organisation du centre pour valider l’organisation.</p></div></CardContent></Card>}
    </>}
  </div>
}
