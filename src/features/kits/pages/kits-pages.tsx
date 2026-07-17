/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { PackageCheck, Search } from "lucide-react"

import { getApiErrorMessage } from "@/api/api-error"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { currentCenterId, currentScopeParams } from "@/features/affectations/scope"
import { EmptyState, ErrorBox, Loading, PageHeader, PermissionGuard, StatusBadge } from "@/features/accounts/components"
import { useAuthStore } from "@/stores/auth-store"
import { kitsApi } from "../api"
import { KITS_PERMISSIONS as P } from "../permissions"
import type { KitArticle, KitArticlePayload, KitArticleType, KitRemise } from "../types"

const selectClass = "h-12 w-full rounded-xl border bg-background px-4 text-base"
const textareaClass = "min-h-28 w-full rounded-xl border bg-background p-3 text-base"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>
}

function hasPermission(code: string) {
  return useAuthStore.getState().context?.affectation_courante?.permissions.includes(code) ?? false
}

function currentSessionId() {
  return useAuthStore.getState().context?.affectation_courante?.session?.id ?? null
}

function articleTypeLabel(type: KitArticleType) {
  return type === "A_APPORTER" ? "À apporter" : "À remettre"
}

function isActive(status?: string) {
  return String(status || "").toUpperCase() === "ACTIF"
}

export function KitsPage() {
  const [articles, setArticles] = useState<KitArticle[]>([])
  const [remises, setRemises] = useState<KitRemise[]>([])
  const [tab, setTab] = useState<"A_APPORTER" | "A_REMETTRE" | "REMISES">("A_APPORTER")
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")
  const permissions = useAuthStore((state) => state.context?.affectation_courante?.permissions ?? [])
  const scope = currentScopeParams() as Record<string, string | number | undefined>
  const sessionId = Number(scope.session_id || currentSessionId() || 0)
  const centreId = Number(scope.centre_id || currentCenterId() || 0)
  const canViewArticles = permissions.includes(P.VIEW_ARTICLES)
  const canViewRemises = permissions.includes(P.VIEW_REMISES)

  async function load() {
    setLoading(true)
    setError("")
    try {
      const requests: Promise<unknown>[] = []
      const articleType = tab === "REMISES" ? undefined : tab
      if (canViewArticles && articleType) requests.push(kitsApi.articles({ session_id: sessionId || undefined, centre_id: centreId || undefined, type_kit: articleType, inclure_globaux: true }).then(setArticles))
      if (canViewRemises) requests.push(kitsApi.remises({ session_id: sessionId || undefined, centre_id: centreId || undefined }).then(setRemises))
      await Promise.all(requests)
    } catch (exception) {
      setError(getApiErrorMessage(exception))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [tab])

  const filteredArticles = useMemo(() => {
    const value = query.trim().toLowerCase()
    return articles
      .filter((article) => !value || [article.designation, article.description, article.centre?.nom, article.statut].filter(Boolean).some((item) => String(item).toLowerCase().includes(value)))
      .sort((a, b) => a.ordre - b.ordre || a.designation.localeCompare(b.designation))
  }, [articles, query, tab])

  const filteredRemises = useMemo(() => {
    const value = query.trim().toLowerCase()
    return remises.filter((remise) => !value || [
      remise.article_kit.designation,
      remise.affectation_centre.immerge.code_fasoim,
      remise.affectation_centre.centre.nom,
      remise.statut_remise,
    ].filter(Boolean).some((item) => String(item).toLowerCase().includes(value)))
  }, [remises, query])

  async function toggleArticle(article: KitArticle) {
    setBusy(true)
    setError("")
    try {
      if (isActive(article.statut)) await kitsApi.disableArticle(article.id)
      else await kitsApi.enableArticle(article.id)
      await load()
    } catch (exception) {
      setError(getApiErrorMessage(exception))
    } finally {
      setBusy(false)
    }
  }

  async function prepareRemises() {
    if (!sessionId || !centreId) {
      setError("Choisissez une affectation de centre pour préparer les remises.")
      return
    }
    setBusy(true)
    setInfo("")
    setError("")
    try {
      const result = await kitsApi.prepareMass({ session_id: sessionId, centre_id: centreId })
      setInfo(result.message || "Préparation lancée.")
      await load()
    } catch (exception) {
      setError(getApiErrorMessage(exception))
    } finally {
      setBusy(false)
    }
  }

  async function markDelivered(remise: KitRemise) {
    setBusy(true)
    setError("")
    try {
      await kitsApi.recordRemise({
        affectation_centre_id: remise.affectation_centre.id,
        article_kit_id: remise.article_kit.id,
        quantite_remise: remise.quantite_prevue,
      })
      await load()
    } catch (exception) {
      setError(getApiErrorMessage(exception))
    } finally {
      setBusy(false)
    }
  }

  return <>
    <PageHeader title="Kits" description="Articles à apporter, articles à remettre et suivi des remises." backTo="/app" />
    <div className="mb-5 flex flex-wrap gap-3">
      <Button variant={tab === "A_APPORTER" ? "default" : "outline"} onClick={() => setTab("A_APPORTER")}>À apporter</Button>
      <Button variant={tab === "A_REMETTRE" ? "default" : "outline"} onClick={() => setTab("A_REMETTRE")}>À remettre</Button>
      <Button variant={tab === "REMISES" ? "default" : "outline"} onClick={() => setTab("REMISES")}>Remises</Button>
    </div>
    <Card className="mb-6 p-5">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input className="h-12 rounded-xl pl-12 text-base" placeholder="Rechercher par article, centre, immergé ou statut" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          {tab === "A_APPORTER" && <PermissionGuard permission={P.CREATE_BRING_ARTICLE}><Button render={<Link to="/app/kits/articles/nouveau-a-apporter" />} className="h-12 rounded-xl">Nouvel article à apporter</Button></PermissionGuard>}
          {tab === "A_REMETTRE" && <PermissionGuard permission={P.CREATE_GIVE_ARTICLE}><Button render={<Link to="/app/kits/articles/nouveau-a-remettre" />} className="h-12 rounded-xl">Nouvel article à remettre</Button></PermissionGuard>}
          {tab === "REMISES" && <PermissionGuard permission={P.PREPARE_MASS}><Button className="h-12 rounded-xl" disabled={busy} onClick={() => void prepareRemises()}>Préparer les remises</Button></PermissionGuard>}
        </div>
      </div>
    </Card>
    {error && <div className="mb-5"><ErrorBox message={error} /></div>}
    {info && <div className="mb-5 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm text-primary">{info}</div>}
    {loading ? <Loading /> : tab === "REMISES" ? (
      !canViewRemises ? <EmptyState message="Aucun accès aux remises de kits." /> : filteredRemises.length === 0 ? <EmptyState message="Aucune remise trouvée." /> : <Card className="overflow-hidden"><Table><TableHeader><TableRow><TableHead className="h-14 px-5">Immergé</TableHead><TableHead>Article</TableHead><TableHead>Quantité</TableHead><TableHead>Statut</TableHead><TableHead /></TableRow></TableHeader><TableBody>{filteredRemises.map((remise) => <TableRow key={remise.id} className="h-20"><TableCell className="px-5"><p className="font-semibold">{remise.affectation_centre.immerge.code_fasoim || `#${remise.affectation_centre.immerge.id}`}</p><p className="mt-1 text-sm text-muted-foreground">{remise.affectation_centre.centre.nom}</p></TableCell><TableCell>{remise.article_kit.designation}</TableCell><TableCell>{remise.quantite_remise}/{remise.quantite_prevue} {remise.article_kit.unite}</TableCell><TableCell><StatusBadge value={remise.statut_remise.toLowerCase()} /></TableCell><TableCell className="text-right"><div className="flex justify-end gap-2"><PermissionGuard permission={P.RECORD_REMISE}><Button variant="outline" disabled={busy || remise.est_complete} onClick={() => void markDelivered(remise)}>Remis</Button><Button variant="secondary" disabled={busy} onClick={async () => { await kitsApi.dispenseRemise(remise.id); await load() }}>Dispenser</Button></PermissionGuard><PermissionGuard permission={P.CANCEL_REMISE}><Button variant="destructive" disabled={busy} onClick={async () => { await kitsApi.cancelRemise(remise.id); await load() }}>Annuler</Button></PermissionGuard></div></TableCell></TableRow>)}</TableBody></Table></Card>
    ) : (
      !canViewArticles ? <EmptyState message="Aucun accès aux articles de kit." /> : filteredArticles.length === 0 ? <EmptyState message="Aucun article trouvé." /> : <Card className="overflow-hidden"><Table><TableHeader><TableRow><TableHead className="h-14 px-5">Article</TableHead><TableHead>Portée</TableHead><TableHead>Quantité</TableHead><TableHead>Statut</TableHead><TableHead /></TableRow></TableHeader><TableBody>{filteredArticles.map((article) => <TableRow key={article.id} className="h-20"><TableCell className="px-5"><p className="font-semibold">{article.designation}</p><p className="mt-1 text-sm text-muted-foreground">{articleTypeLabel(article.type_kit)} · {article.obligatoire ? "Obligatoire" : "Facultatif"}</p></TableCell><TableCell>{article.portee.type === "CENTRE" ? article.portee.centre_nom : "Tous les centres"}</TableCell><TableCell>{article.quantite} {article.unite}</TableCell><TableCell><StatusBadge value={article.statut.toLowerCase()} /></TableCell><TableCell className="text-right"><div className="flex justify-end gap-2"><PermissionGuard permission={P.UPDATE_ARTICLE}><Button render={<Link to={`/app/kits/articles/${article.id}/modifier`} />} variant="outline" className="rounded-xl">Modifier</Button></PermissionGuard>{isActive(article.statut) ? <PermissionGuard permission={P.DISABLE_ARTICLE}><Button variant="secondary" disabled={busy} onClick={() => void toggleArticle(article)}>Désactiver</Button></PermissionGuard> : <PermissionGuard permission={P.ENABLE_ARTICLE}><Button variant="secondary" disabled={busy} onClick={() => void toggleArticle(article)}>Réactiver</Button></PermissionGuard>}</div></TableCell></TableRow>)}</TableBody></Table></Card>
    )}
  </>
}

function emptyArticle(type: KitArticleType): KitArticlePayload {
  return {
    session_id: currentSessionId() || 0,
    centre_id: type === "A_APPORTER" ? currentCenterId() : null,
    designation: "",
    description: "",
    type_kit: type,
    quantite: 1,
    unite: "unité",
    obligatoire: true,
    ordre: 0,
    statut: "ACTIF",
  }
}

export function KitArticleFormPage({ edit = false, type = "A_APPORTER" }: { edit?: boolean; type?: KitArticleType }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState<KitArticlePayload>(() => emptyArticle(type))
  const [loading, setLoading] = useState(edit)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const sessionId = currentSessionId()
  const centreId = currentCenterId()
  const canSubmit = edit ? hasPermission(P.UPDATE_ARTICLE) : hasPermission(type === "A_APPORTER" ? P.CREATE_BRING_ARTICLE : P.CREATE_GIVE_ARTICLE)

  useEffect(() => {
    if (!edit || !id) return
    kitsApi.article(Number(id))
      .then((article) => setForm({
        session_id: article.session.id,
        centre_id: article.centre?.id ?? null,
        designation: article.designation,
        description: article.description || "",
        type_kit: article.type_kit,
        quantite: article.quantite,
        unite: article.unite,
        obligatoire: article.obligatoire,
        ordre: article.ordre,
        statut: article.statut,
      }))
      .catch((exception) => setError(getApiErrorMessage(exception)))
      .finally(() => setLoading(false))
  }, [edit, id])

  function setField<K extends keyof KitArticlePayload>(key: K, value: KitArticlePayload[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!sessionId && !form.session_id) {
      setError("Choisissez une affectation rattachée à une session.")
      return
    }
    const payload = { ...form, session_id: form.session_id || sessionId || 0 }
    if (payload.type_kit === "A_APPORTER" && !payload.centre_id && centreId) {
      payload.centre_id = centreId
    }
    setSubmitting(true)
    setError("")
    try {
      if (edit && id) await kitsApi.updateArticle(Number(id), payload)
      else await kitsApi.createArticle(payload)
      navigate("/app/kits")
    } catch (exception) {
      setError(getApiErrorMessage(exception))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loading />
  return <>
    <PageHeader title={edit ? "Modifier l’article" : `Créer un article ${articleTypeLabel(type).toLowerCase()}`} description="Renseignez l’article, la quantité attendue et son caractère obligatoire." backTo="/app/kits" />
    {error && <div className="mb-5"><ErrorBox message={error} /></div>}
    {!canSubmit && <div className="mb-5"><ErrorBox message="Action non autorisée pour votre affectation actuelle." /></div>}
    <form onSubmit={submit} className="space-y-6">
      <Card><CardContent className="grid gap-5 p-6 sm:grid-cols-2">
        <Field label="Type"><select className={selectClass} value={form.type_kit} disabled={!edit} onChange={(event) => setField("type_kit", event.target.value as KitArticleType)}><option value="A_APPORTER">À apporter</option><option value="A_REMETTRE">À remettre</option></select></Field>
        <Field label="Portée"><select className={selectClass} value={form.centre_id ? "CENTRE" : "SESSION"} disabled={form.type_kit === "A_APPORTER"} onChange={(event) => setField("centre_id", event.target.value === "CENTRE" ? centreId : null)}><option value="SESSION">Tous les centres</option><option value="CENTRE">Ce centre</option></select></Field>
        <Field label="Article *"><Input className="h-12" value={form.designation} onChange={(event) => setField("designation", event.target.value)} placeholder="Ex. Drap, tenue de sport, savon" required /></Field>
        <Field label="Nombre demandé *"><Input className="h-12" type="number" min={1} value={form.quantite} onChange={(event) => setField("quantite", Number(event.target.value))} required /></Field>
        <Field label="Format"><Input className="h-12" value={form.unite} onChange={(event) => setField("unite", event.target.value)} placeholder="Ex. pièce, paire, lot" required /></Field>
        <label className="flex items-center justify-between rounded-xl border p-4 sm:col-span-2"><span>Article obligatoire</span><input type="checkbox" className="size-5 accent-primary" checked={form.obligatoire} onChange={(event) => setField("obligatoire", event.target.checked)} /></label>
        <div className="sm:col-span-2"><Field label="Description"><textarea className={textareaClass} value={form.description} onChange={(event) => setField("description", event.target.value)} /></Field></div>
      </CardContent></Card>
      <div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => navigate("/app/kits")}>Annuler</Button><Button type="submit" disabled={submitting || !canSubmit}>{submitting ? "Enregistrement..." : "Enregistrer"}</Button></div>
    </form>
    <Card className="mt-6 border-primary/20 bg-primary/5"><CardContent className="flex items-start gap-3 p-4 text-sm text-muted-foreground"><PackageCheck className="mt-0.5 size-5 shrink-0 text-primary" />Les articles à apporter sont rattachés au centre. Les articles à remettre peuvent être communs à toute la session ou limités au centre courant.</CardContent></Card>
  </>
}
