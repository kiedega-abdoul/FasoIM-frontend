import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

import { getApiErrorMessage } from "@/api/api-error"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/features/accounts/components"
import { sessionsApi } from "@/features/sessions/api"
import type { ImmersionSession } from "@/features/sessions/types"
import { currentAssignmentSessionId } from "@/services/current-assignment-scope"

import { importsApi } from "../api"
import { SOURCE_LABELS } from "../labels"
import { compatibleImportSources } from "../session-source"
import type { ImportSource } from "../types"

export function ImportCreatePage() {
  const nav = useNavigate()
  const [sessions, setSessions] = useState<ImmersionSession[]>([])
  const [sessionId, setSessionId] = useState<number | null>(currentAssignmentSessionId())
  const [source, setSource] = useState<ImportSource | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [comment, setComment] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    sessionsApi.sessions({ page_size: 1000 }).then((items) => {
      const eligible = items.filter((item) => item.accepte_import)
      setSessions(eligible)
      const forcedId = currentAssignmentSessionId()
      const chosen = forcedId ? eligible.find((item) => item.id === forcedId) : eligible[0]
      if (chosen) setSessionId(chosen.id)
    }).catch((error) => toast.error(getApiErrorMessage(error)))
  }, [])

  const selectedSession = sessions.find((item) => item.id === sessionId) ?? null
  const sources = useMemo(() => compatibleImportSources(selectedSession?.public_cible), [selectedSession?.public_cible])

  useEffect(() => {
    queueMicrotask(() => {
      if (sources.length === 1) setSource(sources[0])
      else if (source && !sources.includes(source)) setSource(null)
    })
  }, [sessionId, source, sources])

  async function submit(force = false) {
    if (!sessionId || !source || !file) {
      toast.error("Choisissez la session, la source et le fichier.")
      return
    }
    setBusy(true)
    try {
      const created = await importsApi.create({ session: sessionId, type_source: source, fichier: file, commentaire: comment, continuer_malgre_doublon: force })
      toast.success("Import créé. Lecture du fichier lancée.")
      nav(`/app/imports/${created.id}`)
    } catch (error) {
      const data = axios.isAxiosError(error) ? error.response?.data : null
      const duplicate = JSON.stringify(data).includes("FICHIER_DEJA_IMPORTE")
      if (duplicate && !force && window.confirm("Ce fichier a déjà été importé pour cette session. Continuer quand même ?")) {
        setBusy(false)
        await submit(true)
        return
      }
      toast.error(getApiErrorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader title="Nouvel import officiel" description="La session et la source doivent correspondre à l’affectation de travail." backTo="/app/imports" />
      <Card><CardContent className="space-y-7 p-6">
        <section>
          <Label className="text-base font-semibold">Session d’import</Label>
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {sessions.map((item) => {
              const selected = item.id === sessionId
              return <button key={item.id} type="button" onClick={() => setSessionId(item.id)} className={`flex min-h-28 items-start gap-3 rounded-2xl border p-4 text-left transition ${selected ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-primary/40"}`}>
                <span className={`mt-1 flex size-6 items-center justify-center rounded-full border ${selected ? "border-primary bg-primary text-primary-foreground" : ""}`}>{selected && <CheckCircle2 className="size-4" />}</span>
                <span><strong className="block text-base">{item.nom}</strong><span className="mt-1 block text-sm text-muted-foreground">{item.code}</span><span className="mt-2 block text-sm">{item.type_session} · {item.public_cible}</span></span>
              </button>
            })}
          </div>
        </section>

        <section>
          <Label className="text-base font-semibold">Source de la liste</Label>
          <p className="mt-1 text-sm text-muted-foreground">Seules les sources compatibles avec le public cible sont proposées.</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {sources.map((value) => <Button key={value} type="button" size="lg" variant={source === value ? "default" : "outline"} onClick={() => setSource(value)}>{SOURCE_LABELS[value]}</Button>)}
            {selectedSession && sources.length === 0 && <p className="text-sm text-destructive">Aucune source d’import n’est compatible avec cette session.</p>}
          </div>
        </section>

        <section><Label>Fichier Excel ou CSV</Label><Input className="mt-2 h-12" type="file" accept=".xlsx,.xls,.csv" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></section>
        <section><Label>Commentaire</Label><textarea className="mt-2 min-h-28 w-full rounded-xl border bg-background p-3" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Précision sur l’origine ou le contenu du fichier" /></section>
        <div className="flex justify-end"><Button size="lg" disabled={busy || !sessionId || !source || !file} onClick={() => void submit()}>{busy ? "Envoi…" : "Téléverser et analyser"}</Button></div>
      </CardContent></Card>
    </>
  )
}
