/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

import { getApiErrorMessage } from "@/api/api-error"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { EmptyState, ErrorBox, Loading, PageHeader } from "@/features/accounts/components"
import { useAuthStore } from "@/stores/auth-store"
import { sessionsApi } from "../api"
import { PUBLIC_LABELS, SESSION_TYPE_LABELS } from "../labels"
import { SESSION_PERMISSIONS as P } from "../permissions"
import type { ImmersionSession, PublicCible, SessionPayload, SessionType } from "../types"

const selectClass = "h-12 w-full rounded-xl border bg-background px-3 text-base"
const textAreaClass = "w-full rounded-xl border bg-background px-4 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
const allowedPublics: Record<SessionType, PublicCible[]> = { examen: ["BEPC", "BAC"], concours: ["CONCOURS"], selectionne: ["SELECTIONNE"], volontaire: ["VOLONTAIRE"], mixte: ["MIXTE"] }

function emptyForm(): SessionPayload { return { nom: "", annee: new Date().getFullYear(), type_session: "examen", public_cible: "BEPC", date_debut: "", date_fin: "", date_ouverture_inscription: null, date_fermeture_inscription: null, description: "" } }
function fromSession(s: ImmersionSession): SessionPayload { return { nom: s.nom, annee: s.annee, type_session: s.type_session, public_cible: s.public_cible, date_debut: s.date_debut, date_fin: s.date_fin, date_ouverture_inscription: s.date_ouverture_inscription, date_fermeture_inscription: s.date_fermeture_inscription, description: s.description } }

export function SessionFormPage({ edit = false }: { edit?: boolean }) {
  const { sessionId } = useParams(); const navigate = useNavigate()
  const canConfigure = useAuthStore((s) => s.context?.affectation_courante?.permissions.includes(P.CONFIGURE) ?? false)
  const [session, setSession] = useState<ImmersionSession | null>(null); const [form, setForm] = useState<SessionPayload>(emptyForm)
  const [loading, setLoading] = useState(edit); const [submitting, setSubmitting] = useState(false); const [error, setError] = useState("")
  useEffect(() => { if (!edit || !sessionId) { setLoading(false); return } sessionsApi.session(Number(sessionId)).then((v) => { setSession(v); setForm(fromSession(v)) }).catch((e) => setError(getApiErrorMessage(e))).finally(() => setLoading(false)) }, [edit, sessionId])
  const locked = session ? ["terminee", "archivee", "annulee"].includes(session.statut) : false
  const inProgress = session?.statut === "en_cours"
  const availablePublics = useMemo(() => allowedPublics[form.type_session], [form.type_session])
  function setField<K extends keyof SessionPayload>(key: K, value: SessionPayload[K]) { setForm((c) => ({ ...c, [key]: value })) }
  function changeType(value: SessionType) { setForm((c) => ({ ...c, type_session: value, public_cible: allowedPublics[value][0] })) }
  async function submit(event: React.FormEvent) { event.preventDefault(); setSubmitting(true); setError(""); try { if (edit && sessionId) { await sessionsApi.update(Number(sessionId), inProgress ? { description: form.description } : form); navigate(`/app/sessions/${sessionId}`) } else { const created = await sessionsApi.create(form); navigate(canConfigure ? `/app/sessions/${created.id}/parametres/configurer` : `/app/sessions/${created.id}`) } } catch (e) { setError(getApiErrorMessage(e)) } finally { setSubmitting(false) } }
  if (loading) return <Loading />
  if (locked) return <><PageHeader title="Session non modifiable" backTo={`/app/sessions/${sessionId}`} /><EmptyState message="Cette session est disponible uniquement en consultation." /></>
  return <><PageHeader title={edit ? "Modifier la session" : "Créer une session"} description="Renseignez uniquement les informations générales. Les paramètres sont configurés séparément." backTo={edit ? `/app/sessions/${sessionId}` : "/app/sessions"} />{error && <div className="mb-5"><ErrorBox message={error} /></div>}<form onSubmit={submit} className="space-y-6"><Card><CardContent className="p-6 sm:p-8"><h2 className="text-xl font-semibold">Informations générales</h2><p className="mt-1 text-sm text-muted-foreground">Le code et le numéro de promotion sont calculés automatiquement.</p><div className="mt-6 grid gap-5 sm:grid-cols-2">
  <div className="space-y-2 sm:col-span-2"><Label>Nom de la session *</Label><Input className="h-12" value={form.nom} disabled={inProgress} onChange={(e) => setField("nom", e.target.value)} required /></div>
  <div className="space-y-2"><Label>Année *</Label><Input className="h-12" type="number" min={2025} max={2100} value={form.annee} disabled={inProgress} onChange={(e) => setField("annee", Number(e.target.value))} required /></div>
  <div className="space-y-2"><Label>Type de session *</Label><select className={selectClass} value={form.type_session} disabled={inProgress} onChange={(e) => changeType(e.target.value as SessionType)}>{Object.entries(SESSION_TYPE_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></div>
  <div className="space-y-2"><Label>Public cible *</Label><select className={selectClass} value={form.public_cible} disabled={inProgress} onChange={(e) => setField("public_cible", e.target.value as PublicCible)}>{availablePublics.map((v) => <option key={v} value={v}>{PUBLIC_LABELS[v]}</option>)}</select></div>
  <div className="space-y-2"><Label>Date de début *</Label><Input className="h-12" type="date" value={form.date_debut} disabled={inProgress} onChange={(e) => setField("date_debut", e.target.value)} required /></div>
  <div className="space-y-2"><Label>Date de fin *</Label><Input className="h-12" type="date" value={form.date_fin} disabled={inProgress} onChange={(e) => setField("date_fin", e.target.value)} required /></div>
  <div className="space-y-2"><Label>Ouverture des inscriptions</Label><Input className="h-12" type="date" value={form.date_ouverture_inscription ?? ""} disabled={inProgress} onChange={(e) => setField("date_ouverture_inscription", e.target.value || null)} /></div>
  <div className="space-y-2"><Label>Fermeture des inscriptions</Label><Input className="h-12" type="date" value={form.date_fermeture_inscription ?? ""} disabled={inProgress} onChange={(e) => setField("date_fermeture_inscription", e.target.value || null)} /></div>
  <div className="space-y-2 sm:col-span-2"><Label>Description</Label><textarea rows={5} className={textAreaClass} value={form.description} onChange={(e) => setField("description", e.target.value)} /></div>
</div></CardContent></Card><div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => navigate(edit ? `/app/sessions/${sessionId}` : "/app/sessions")}>Annuler</Button><Button type="submit" disabled={submitting}>{submitting ? "Enregistrement…" : "Enregistrer"}</Button></div></form></>
}
