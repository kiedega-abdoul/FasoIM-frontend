import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Search } from "lucide-react"

import { getApiErrorMessage } from "@/api/api-error"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  EmptyState,
  ErrorBox,
  Loading,
  PageHeader,
} from "@/features/accounts/components"
import { sessionsApi } from "@/features/sessions/api"
import type { ImmersionSession } from "@/features/sessions/types"
import { currentAssignmentSessionId, currentAssignmentSessionParams } from "@/services/current-assignment-scope"

import { importsApi } from "../api"
import { ImportStatusBadge } from "../components"
import { formatBytes, formatDate, SOURCE_LABELS, STATUS_LABELS } from "../labels"
import { IMPORT_PERMISSIONS as P } from "../permissions"
import { compatibleImportSources } from "../session-source"
import type { ImportSource, ImportStatus, OfficialImport } from "../types"

function ImportResultSummary({ item }: { item: OfficialImport }) {
  if (item.statut === "TERMINE") {
    return (
      <div>
        <p className="font-semibold text-primary">{item.lignes_importees} importée(s)</p>
        <p className="text-sm text-muted-foreground">{item.lignes_erreur} erreur(s) · {item.lignes_ignorees} ignorée(s)</p>
      </div>
    )
  }
  if (item.statut === "ANNULE") {
    return (
      <div>
        <p className="font-medium">Import annulé</p>
        <p className="text-sm text-muted-foreground">{item.total_lignes} ligne(s) détectée(s)</p>
      </div>
    )
  }
  return (
    <div>
      <p>{item.lignes_valides} valide(s)</p>
      <p className="text-sm text-muted-foreground">{item.lignes_erreur} erreur(s) · {item.lignes_ignorees} ignorée(s)</p>
    </div>
  )
}

const ACTIVE_STATUSES: ImportStatus[] = [
  "RECU",
  "LECTURE_COLONNES_EN_COURS",
  "CORRESPONDANCE_REQUISE",
  "CORRESPONDANCE_VALIDEE",
  "VALIDATION_EN_COURS",
  "VALIDE",
  "VALIDE_AVEC_ERREURS",
  "CONFIRMATION_EN_COURS",
]

export function ImportsListPage() {
  const [rows, setRows] = useState<OfficialImport[]>([])
  const [session, setSession] = useState<ImmersionSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<ImportStatus | "">("")
  const [source, setSource] = useState<ImportSource | "">("")

  async function load() {
    setLoading(true)
    try {
      const sessionId = currentAssignmentSessionId()
      const [items, currentSession] = await Promise.all([
        importsApi.list({ ...currentAssignmentSessionParams(), page_size: 1000 }),
        sessionId ? sessionsApi.session(sessionId) : Promise.resolve(null),
      ])
      setRows(items)
      setSession(currentSession)
      setError("")
    } catch (e) {
      setError(getApiErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load()
    }, 0)

    return () => window.clearTimeout(timer)
    // Chargement initial uniquement.
  }, [])

  const allowedSources = useMemo(() => {
    const compatible = compatibleImportSources(session?.public_cible)
    if (compatible.length > 0) return compatible
    return Array.from(new Set(rows.map((item) => item.type_source)))
  }, [rows, session?.public_cible])

  const availableStatuses = useMemo(() => {
    return Array.from(new Set(rows.map((item) => item.statut)))
  }, [rows])

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase()
    return rows.filter((item) => {
      if (source && item.type_source !== source) return false
      if (status && item.statut !== status) return false
      if (!value) return true
      return [item.nom_fichier_original, item.session_code, item.session_libelle, item.importe_par_nom]
        .some((field) => field?.toLowerCase().includes(value))
    })
  }, [query, rows, source, status])

  const completed = rows.filter((item) => item.statut === "TERMINE").length
  const active = rows.filter((item) => ACTIVE_STATUSES.includes(item.statut)).length
  const withIssues = rows.filter((item) => item.statut === "ECHEC" || item.statut === "VALIDE_AVEC_ERREURS" || item.lignes_erreur > 0).length

  return (
    <>
      <PageHeader
        title="Imports officiels"
        description={session ? `Imports de ${session.nom} · ${session.type_session} · ${session.public_cible}` : "Téléversez, contrôlez et confirmez les listes officielles avant la création des immergés."}
        backTo="/app"
        actionTo="/app/imports/nouveau"
        actionLabel="Nouvel import"
        actionPermission={P.CREATE}
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="flex min-h-20 items-center gap-3 px-4 py-3"><div className="rounded-xl bg-primary/10 p-2 text-primary"><FileSpreadsheet className="size-5" /></div><div><p className="text-xs text-muted-foreground">Total</p><p className="text-xl font-bold leading-tight">{rows.length}</p></div></Card>
        <Card className="flex min-h-20 items-center gap-3 px-4 py-3"><div className="rounded-xl bg-primary/10 p-2 text-primary"><CheckCircle2 className="size-5" /></div><div><p className="text-xs text-muted-foreground">Terminés</p><p className="text-xl font-bold leading-tight">{completed}</p></div></Card>
        <Card className="flex min-h-20 items-center gap-3 px-4 py-3"><div className="rounded-xl bg-primary/10 p-2 text-primary"><FileSpreadsheet className="size-5" /></div><div><p className="text-xs text-muted-foreground">En traitement</p><p className="text-xl font-bold leading-tight">{active}</p></div></Card>
        <Card className="flex min-h-20 items-center gap-3 px-4 py-3"><div className="rounded-xl bg-amber-50 p-2 text-amber-700"><AlertTriangle className="size-5" /></div><div><p className="text-xs text-muted-foreground">Avec anomalies</p><p className="text-xl font-bold leading-tight">{withIssues}</p></div></Card>
      </div>

      <Card className="mb-4 p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="h-10 pl-9" placeholder="Rechercher un fichier ou un importateur" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Source</span>
            {allowedSources.length > 1 && <Button className="h-9 px-3" type="button" variant={source === "" ? "default" : "outline"} onClick={() => setSource("")}>Toutes</Button>}
            {allowedSources.map((value) => <Button className="h-9 px-3" key={value} type="button" variant={source === value || (allowedSources.length === 1 && source === "") ? "default" : "outline"} onClick={() => setSource(value)}>{SOURCE_LABELS[value]}</Button>)}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Statut</span>
            <Button className="h-9 px-3" type="button" variant={status === "" ? "default" : "outline"} onClick={() => setStatus("")}>Tous ({rows.length})</Button>
            {availableStatuses.map((value) => {
              const count = rows.filter((item) => item.statut === value).length
              return <Button className="h-9 px-3" key={value} type="button" variant={status === value ? "default" : "outline"} onClick={() => setStatus(value)}>{STATUS_LABELS[value]} ({count})</Button>
            })}
          </div>

          {(query || source || status) && <Button className="h-9 shrink-0 px-3" type="button" variant="outline" onClick={() => { setQuery(""); setSource(""); setStatus("") }}>Réinitialiser</Button>}
        </div>
      </Card>

      {error && <ErrorBox message={error} />}
      {loading ? <Loading /> : filtered.length === 0 ? <EmptyState message="Aucun import officiel ne correspond aux filtres." /> : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader><TableRow><TableHead className="px-5">Fichier</TableHead><TableHead>Source</TableHead><TableHead>Résultats</TableHead><TableHead>Statut</TableHead><TableHead>Date</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>{filtered.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="px-5"><p className="font-semibold">{item.nom_fichier_original}</p><p className="text-sm text-muted-foreground">{formatBytes(item.taille_fichier)}</p></TableCell>
                <TableCell><p className="font-medium">{SOURCE_LABELS[item.type_source]}</p><p className="text-sm text-muted-foreground">{item.session_libelle}</p></TableCell>
                <TableCell><ImportResultSummary item={item} /></TableCell>
                <TableCell><ImportStatusBadge status={item.statut} /></TableCell>
                <TableCell>{formatDate(item.date_import)}</TableCell>
                <TableCell className="text-right"><Button render={<Link to={`/app/imports/${item.id}`} />} variant="outline">Consulter</Button></TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </Card>
      )}
    </>
  )
}
