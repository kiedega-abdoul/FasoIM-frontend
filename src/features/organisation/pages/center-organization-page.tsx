/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react"

import { getApiErrorMessage } from "@/api/api-error"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { currentScopeParams } from "@/features/affectations/scope"
import { EmptyState, ErrorBox, Loading, PageHeader, PermissionGuard, StatusBadge } from "@/features/accounts/components"
import { useAuthStore } from "@/stores/auth-store"
import { organisationApi } from "../api"
import { ORGANISATION_PERMISSIONS as P } from "../permissions"
import type { CenterOrganizationPayload, CenterOrganizationRule, CenterOrganizationSummary } from "../types"

const textAreaClass = "min-h-28 w-full rounded-xl border bg-background p-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>
}

function emptyForm(): CenterOrganizationPayload {
  return {
    capacite_ouverte: 1,
    seuil_division_sections: 30,
    capacite_max_section: 30,
    seuil_division_groupes: 10,
    capacite_max_groupe: 10,
    repartition_sections_groupes_automatique: true,
    attribution_lits_automatique: true,
    lieu_accueil: "",
    heure_accueil: null,
    horaires_generaux: "",
    consignes_accueil: "",
    consignes_hebergement: "",
    consignes_kits_a_apporter: "",
    consignes_repas: "",
    regles_discipline: "",
    consignes_internes: "",
    directives_locales: "",
  }
}

function formFromRule(rule: CenterOrganizationRule): CenterOrganizationPayload {
  return {
    capacite_ouverte: rule.capacite_ouverte,
    seuil_division_sections: rule.seuil_division_sections,
    capacite_max_section: rule.capacite_max_section,
    seuil_division_groupes: rule.seuil_division_groupes,
    capacite_max_groupe: rule.capacite_max_groupe,
    repartition_sections_groupes_automatique: rule.repartition_sections_groupes_automatique,
    attribution_lits_automatique: rule.attribution_lits_automatique,
    lieu_accueil: rule.lieu_accueil || "",
    heure_accueil: rule.heure_accueil || null,
    horaires_generaux: rule.horaires_generaux || "",
    consignes_accueil: rule.consignes_accueil || "",
    consignes_hebergement: rule.consignes_hebergement || "",
    consignes_kits_a_apporter: rule.consignes_kits_a_apporter || "",
    consignes_repas: rule.consignes_repas || "",
    regles_discipline: rule.regles_discipline || "",
    consignes_internes: rule.consignes_internes || "",
    directives_locales: rule.directives_locales || "",
  }
}

export function CenterOrganizationPage() {
  const permissions = useAuthStore((state) => state.context?.affectation_courante?.permissions ?? [])
  const [rule, setRule] = useState<CenterOrganizationRule | null>(null)
  const [summary, setSummary] = useState<CenterOrganizationSummary | null>(null)
  const [form, setForm] = useState<CenterOrganizationPayload>(emptyForm)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")

  const scope = currentScopeParams() as Record<string, string | number | undefined>
  const sessionId = Number(scope.session_id || 0)
  const centerId = Number(scope.centre_id || 0)
  const canEdit = rule ? permissions.includes(P.UPDATE_CENTER_RULES) : permissions.includes(P.CONFIGURE_CENTER_RULES)

  async function load() {
    setLoading(true)
    setError("")
    setInfo("")
    try {
      if (!sessionId || !centerId) {
        setRule(null)
        setSummary(null)
        setForm(emptyForm())
        return
      }
      const rules = await organisationApi.centerRules({ session_id: sessionId, centre_id: centerId })
      const currentRule = rules[0] ?? null
      const currentSummary = currentRule ? await organisationApi.centerRuleSummary(currentRule.id) : null
      setRule(currentRule)
      setSummary(currentSummary)
      setForm(currentRule ? formFromRule(currentRule) : emptyForm())
    } catch (exception) {
      setError(getApiErrorMessage(exception))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [sessionId, centerId])

  function setField<K extends keyof CenterOrganizationPayload>(key: K, value: CenterOrganizationPayload[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!canEdit || !sessionId || !centerId) return
    setSubmitting(true)
    setError("")
    setInfo("")
    try {
      const payload = { ...form, heure_accueil: form.heure_accueil || null }
      const saved = rule
        ? await organisationApi.updateCenterRule(rule.id, payload)
        : await organisationApi.createCenterRule({ ...payload, session_id: sessionId, centre_id: centerId })
      const currentSummary = await organisationApi.centerRuleSummary(saved.id)
      setRule(saved)
      setSummary(currentSummary)
      setForm(formFromRule(saved))
      setInfo("Organisation du centre enregistrée.")
    } catch (exception) {
      setError(getApiErrorMessage(exception))
    } finally {
      setSubmitting(false)
    }
  }

  async function runAction(action: () => Promise<unknown>, message: string) {
    setSubmitting(true)
    setError("")
    setInfo("")
    try {
      const result = await action()
      if (result && typeof result === "object" && "id" in result) {
        const updated = result as CenterOrganizationRule
        setRule(updated)
        setForm(formFromRule(updated))
      }
      if (rule) setSummary(await organisationApi.centerRuleSummary(rule.id))
      setInfo(message)
    } catch (exception) {
      setError(getApiErrorMessage(exception))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loading />
  const openedPlaces = rule?.capacite_ouverte ?? form.capacite_ouverte
  const occupiedPlaces = summary?.total_affectations_centre ?? 0
  const remainingPlaces = Math.max(0, openedPlaces - occupiedPlaces)

  return <>
    <PageHeader title="Organisation du centre" description="Capacité d’accueil, sections, groupes et consignes du centre." backTo="/app" />

    {(!sessionId || !centerId) && <EmptyState message="Cette page s’utilise avec une affectation de centre." />}
    {error && <div className="mb-5"><ErrorBox message={error} /></div>}
    {info && <div className="mb-5 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm text-primary">{info}</div>}

    {sessionId && centerId ? <form onSubmit={submit} className="space-y-6">
      {rule && <Card><CardContent className="grid gap-4 p-6 sm:grid-cols-3">
        <div><p className="text-sm text-muted-foreground">Centre</p><p className="mt-1 font-semibold">{rule.centre?.nom || rule.centre?.code}</p></div>
        <div><p className="text-sm text-muted-foreground">Session</p><p className="mt-1 font-semibold">{rule.session?.nom || rule.session?.code}</p></div>
        <div><p className="text-sm text-muted-foreground">Statut</p><div className="mt-1"><StatusBadge value={rule.statut.toLowerCase()} /></div></div>
      </CardContent></Card>}

      {summary && <Card><CardContent className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
        <div><p className="text-sm text-muted-foreground">Places ouvertes</p><p className="mt-1 text-2xl font-semibold">{openedPlaces}</p></div>
        <div><p className="text-sm text-muted-foreground">Places occupées</p><p className="mt-1 text-2xl font-semibold">{occupiedPlaces}</p></div>
        <div><p className="text-sm text-muted-foreground">Places restantes</p><p className="mt-1 text-2xl font-semibold">{remainingPlaces}</p></div>
        <div><p className="text-sm text-muted-foreground">Sections</p><p className="mt-1 text-2xl font-semibold">{summary.sections}</p></div>
        <div><p className="text-sm text-muted-foreground">Groupes</p><p className="mt-1 text-2xl font-semibold">{summary.groupes}</p></div>
        <div><p className="text-sm text-muted-foreground">Affectés aux groupes</p><p className="mt-1 text-2xl font-semibold">{summary.affectations_groupes_actives}/{summary.total_affectations_centre}</p></div>
        {summary.hebergement_active && <>
          <div><p className="text-sm text-muted-foreground">Lits utilisables</p><p className="mt-1 text-2xl font-semibold">{summary.lits_utilisables}</p></div>
          <div><p className="text-sm text-muted-foreground">Attributions de lits</p><p className="mt-1 text-2xl font-semibold">{summary.attributions_lits_actives}/{summary.total_affectations_centre}</p></div>
        </>}
      </CardContent></Card>}

      <Card><CardContent className="grid gap-5 p-6 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Places ouvertes *"><Input disabled={!canEdit} className="h-12" type="number" min={1} value={form.capacite_ouverte} onChange={(event) => setField("capacite_ouverte", Number(event.target.value))} required /></Field>
        <Field label="Seuil de création des sections *"><Input disabled={!canEdit} className="h-12" type="number" min={2} value={form.seuil_division_sections} onChange={(event) => setField("seuil_division_sections", Number(event.target.value))} required /></Field>
        <Field label="Places par section *"><Input disabled={!canEdit} className="h-12" type="number" min={1} value={form.capacite_max_section} onChange={(event) => setField("capacite_max_section", Number(event.target.value))} required /></Field>
        <Field label="Seuil de création des groupes *"><Input disabled={!canEdit} className="h-12" type="number" min={2} value={form.seuil_division_groupes} onChange={(event) => setField("seuil_division_groupes", Number(event.target.value))} required /></Field>
        <Field label="Places par groupe *"><Input disabled={!canEdit} className="h-12" type="number" min={1} value={form.capacite_max_groupe} onChange={(event) => setField("capacite_max_groupe", Number(event.target.value))} required /></Field>
        <Field label="Heure d’accueil"><Input disabled={!canEdit} className="h-12" type="time" value={form.heure_accueil ?? ""} onChange={(event) => setField("heure_accueil", event.target.value || null)} /></Field>
        <label className="flex items-center justify-between rounded-xl border p-4 lg:col-span-3"><span>Créer automatiquement les sections et les groupes</span><input disabled={!canEdit} type="checkbox" className="size-5 accent-primary" checked={form.repartition_sections_groupes_automatique} onChange={(event) => setField("repartition_sections_groupes_automatique", event.target.checked)} /></label>
        <label className="flex items-center justify-between rounded-xl border p-4 lg:col-span-3"><span>Attribuer les lits automatiquement</span><input disabled={!canEdit} type="checkbox" className="size-5 accent-primary" checked={form.attribution_lits_automatique} onChange={(event) => setField("attribution_lits_automatique", event.target.checked)} /></label>
      </CardContent></Card>

      <Card><CardContent className="grid gap-5 p-6 sm:grid-cols-2">
        <Field label="Lieu d’accueil"><Input disabled={!canEdit} className="h-12" value={form.lieu_accueil} onChange={(event) => setField("lieu_accueil", event.target.value)} /></Field>
        <Field label="Horaires généraux"><textarea disabled={!canEdit} rows={4} className={textAreaClass} value={form.horaires_generaux} onChange={(event) => setField("horaires_generaux", event.target.value)} /></Field>
        <Field label="Consignes d’accueil"><textarea disabled={!canEdit} rows={4} className={textAreaClass} value={form.consignes_accueil} onChange={(event) => setField("consignes_accueil", event.target.value)} /></Field>
        <Field label="Consignes d’hébergement"><textarea disabled={!canEdit} rows={4} className={textAreaClass} value={form.consignes_hebergement} onChange={(event) => setField("consignes_hebergement", event.target.value)} /></Field>
        <Field label="Pièces et effets à apporter"><textarea disabled={!canEdit} rows={4} className={textAreaClass} value={form.consignes_kits_a_apporter} onChange={(event) => setField("consignes_kits_a_apporter", event.target.value)} /></Field>
        <Field label="Consignes de repas"><textarea disabled={!canEdit} rows={4} className={textAreaClass} value={form.consignes_repas} onChange={(event) => setField("consignes_repas", event.target.value)} /></Field>
        <Field label="Règles de discipline"><textarea disabled={!canEdit} rows={4} className={textAreaClass} value={form.regles_discipline} onChange={(event) => setField("regles_discipline", event.target.value)} /></Field>
        <Field label="Consignes internes"><textarea disabled={!canEdit} rows={4} className={textAreaClass} value={form.consignes_internes} onChange={(event) => setField("consignes_internes", event.target.value)} /></Field>
        <div className="sm:col-span-2"><Field label="Directives locales"><textarea disabled={!canEdit} rows={4} className={textAreaClass} value={form.directives_locales} onChange={(event) => setField("directives_locales", event.target.value)} /></Field></div>
      </CardContent></Card>

      <div className="flex flex-wrap justify-end gap-3">
        {rule && summary?.actions.peut_generer_structures && <PermissionGuard permission={P.GENERATE_STRUCTURES}><Button type="button" variant="outline" disabled={submitting} onClick={() => void runAction(() => organisationApi.generateCenterStructures(rule.id), "Création des sections et groupes lancée.")}>Créer les sections et groupes</Button></PermissionGuard>}
        {rule && summary?.actions.peut_valider_organisation && <PermissionGuard permission={P.VALIDATE_CENTER_ORGANIZATION}><Button type="button" variant="secondary" disabled={submitting} onClick={() => void runAction(() => organisationApi.validateCenterOrganization(rule.id), "Organisation du centre validée.")}>Valider l’organisation</Button></PermissionGuard>}
        {rule && summary?.actions.peut_marquer_pret && <PermissionGuard permission={P.MARK_CENTER_READY}><Button type="button" variant="secondary" disabled={submitting} onClick={() => void runAction(() => organisationApi.markCenterReady(rule.id), "Centre marqué prêt pour publication.")}>Marquer prêt</Button></PermissionGuard>}
        {canEdit && <Button type="submit" disabled={submitting}>{submitting ? "Enregistrement..." : "Enregistrer"}</Button>}
      </div>
    </form> : null}
  </>
}
