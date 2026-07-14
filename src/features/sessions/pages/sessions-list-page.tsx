/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Search } from "lucide-react"

import { getApiErrorMessage } from "@/api/api-error"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState, ErrorBox, Loading, PageHeader } from "@/features/accounts/components"
import { sessionsApi } from "../api"
import { SessionPermissionGuard, SessionStatusBadge } from "../components"
import { formatDate, MODE_LABELS, PUBLIC_LABELS, SESSION_TYPE_LABELS } from "../labels"
import { SESSION_PERMISSIONS as P } from "../permissions"
import type { ImmersionSession } from "../types"

export function SessionsListPage() {
  const [rows, setRows] = useState<ImmersionSession[]>([])
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("")
  const [type, setType] = useState("")
  const [year, setYear] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const data = await sessionsApi.sessions({
        statut: status || undefined,
        type_session: type || undefined,
        annee: year || undefined,
      })
      setRows(data)
      setError("")
    } catch (exception) {
      setError(getApiErrorMessage(exception))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase()
    if (!value) return rows
    return rows.filter((session) => [session.nom, session.code, SESSION_TYPE_LABELS[session.type_session], PUBLIC_LABELS[session.public_cible]].some((entry) => entry?.toLowerCase().includes(value)))
  }, [query, rows])

  return <>
    <PageHeader
      title="Gestion des sessions"
      description="Créez, préparez, démarrez, terminez et archivez les sessions d’immersion."
      backTo="/app"
      actionTo="/app/sessions/nouvelle"
      actionLabel="Créer une session"
      actionPermission={P.CREATE}
    />

    <Card className="mb-6 p-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px_180px_140px_auto]">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input className="h-12 rounded-xl pl-12 text-base" placeholder="Rechercher par nom, code, type ou public" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        <select className="h-12 rounded-xl border bg-background px-3" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">Tous les statuts</option>
          <option value="brouillon">Brouillon</option><option value="ouverte">Ouverte</option><option value="en_preparation">En préparation</option><option value="en_cours">En cours</option><option value="terminee">Terminée</option><option value="archivee">Archivée</option><option value="annulee">Annulée</option>
        </select>
        <select className="h-12 rounded-xl border bg-background px-3" value={type} onChange={(event) => setType(event.target.value)}>
          <option value="">Tous les types</option>
          {Object.entries(SESSION_TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <Input className="h-12 rounded-xl" type="number" min={2025} max={2100} placeholder="Année" value={year} onChange={(event) => setYear(event.target.value)} />
        <Button className="h-12 rounded-xl px-6" onClick={() => void load()}>Filtrer</Button>
      </div>
    </Card>

    {error && <ErrorBox message={error} />}
    {loading ? <Loading /> : !error && filtered.length === 0 ? <EmptyState message="Aucune session ne correspond aux critères." /> :
      <Card className="overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead className="px-5">Session</TableHead><TableHead>Type et public</TableHead><TableHead>Période</TableHead><TableHead>Entrée</TableHead><TableHead>Statut</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>{filtered.map((session) => <TableRow key={session.id} className="h-20">
            <TableCell className="px-5"><p className="font-semibold">{session.nom}</p><p className="mt-1 text-sm text-muted-foreground">{session.code} · Promotion {session.numero_promotion}</p></TableCell>
            <TableCell><p>{SESSION_TYPE_LABELS[session.type_session]}</p><p className="text-sm text-muted-foreground">{PUBLIC_LABELS[session.public_cible]}</p></TableCell>
            <TableCell><p>{formatDate(session.date_debut)}</p><p className="text-sm text-muted-foreground">au {formatDate(session.date_fin)}</p></TableCell>
            <TableCell>{session.parametres ? MODE_LABELS[session.parametres.mode_entree] : "Non configuré"}</TableCell>
            <TableCell><SessionStatusBadge status={session.statut} /></TableCell>
            <TableCell className="text-right"><SessionPermissionGuard permission={P.VIEW}><Button render={<Link to={`/app/sessions/${session.id}`} />} variant="outline" className="rounded-xl">Consulter</Button></SessionPermissionGuard></TableCell>
          </TableRow>)}</TableBody>
        </Table>
      </Card>}
  </>
}
