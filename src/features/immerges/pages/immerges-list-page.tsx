import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, BadgeCheck, CircleUserRound, KeyRound, LoaderCircle, Search, UsersRound } from "lucide-react"

import { getApiErrorMessage } from "@/api/api-error"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuthStore } from "@/stores/auth-store"
import { immergesApi } from "../api"
import type { Immerge, ImmergeStats, ImmergeStatus, ImmergeType } from "../types"

const TYPE_LABELS: Record<ImmergeType, string> = {
  BEPC: "BEPC",
  BAC: "BAC",
  CONCOURS: "Concours",
  SELECTIONNE: "Sélectionné",
  VOLONTAIRE: "Volontaire",
}

const STATUS_LABELS: Record<ImmergeStatus, string> = {
  CREE: "Créé",
  CODE_GENERE: "Code généré",
  AFFECTE_REGION: "Affecté à une région",
  AFFECTE_CENTRE: "Affecté à un centre",
  EN_IMMERSION: "En immersion",
  LIBERE: "Libéré",
  ANNULE: "Annulé",
}

function statusBadge(status: ImmergeStatus) {
  if (["AFFECTE_REGION", "AFFECTE_CENTRE", "EN_IMMERSION", "LIBERE"].includes(status)) {
    return <Badge className="bg-primary/10 text-primary hover:bg-primary/10">{STATUS_LABELS[status]}</Badge>
  }
  if (status === "ANNULE") return <Badge variant="destructive">Annulé</Badge>
  return <Badge variant="outline">{STATUS_LABELS[status]}</Badge>
}

export function ImmergesListPage() {
  const navigate = useNavigate()
  const assignment = useAuthStore((state) => state.context?.affectation_courante)
  const [items, setItems] = useState<Immerge[]>([])
  const [stats, setStats] = useState<ImmergeStats | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 50
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [type, setType] = useState("TOUS")
  const [status, setStatus] = useState("TOUS")

  useEffect(() => {
    let active = true

    queueMicrotask(() => {
      if (!active) return
      setLoading(true)
      setError("")

      void Promise.all([
        immergesApi.list({
          page,
          page_size: pageSize,
          type_immerge: type === "TOUS" ? undefined : type,
          statut: status === "TOUS" ? undefined : status,
        }),
        immergesApi.stats(),
      ])
        .then(([listResponse, statsResponse]) => {
          if (!active) return
          setItems(listResponse.results)
          setTotal(listResponse.count)
          setStats(statsResponse)
        })
        .catch((exception) => {
          if (active) setError(getApiErrorMessage(exception))
        })
        .finally(() => {
          if (active) setLoading(false)
        })
    })

    return () => { active = false }
  }, [assignment?.id, page, status, type])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return items.filter((item) => {
      if (!query) return true

      const source = item.source_resume
      return [
        source?.identite_affichable,
        source?.reference,
        source?.telephone,
        source?.email,
        item.code_fasoim,
      ].some((value) => value?.toLowerCase().includes(query))
    })
  }, [items, search])

  const withCode = stats?.codes_generes ?? 0
  const assigned = stats?.deja_affectes ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="space-y-6">
      <div>
        <Button type="button" variant="ghost" className="mb-3 h-10 gap-2 px-0 text-base" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-5" />
          Retour
        </Button>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">DGAS</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Immergés de la session</h1>
        <p className="mt-2 text-muted-foreground">
          {assignment?.session?.nom
            ? `Consultez uniquement les immergés de ${assignment.session.nom}.`
            : "Consultez les immergés dans la zone couverte par votre affectation."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="flex items-center gap-4 p-5"><UsersRound className="size-8 text-primary" /><div><p className="text-2xl font-bold">{stats?.total ?? total}</p><p className="text-sm text-muted-foreground">Total des immergés</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-5"><KeyRound className="size-8 text-primary" /><div><p className="text-2xl font-bold">{withCode}</p><p className="text-sm text-muted-foreground">Codes FasoIM générés</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-5"><BadgeCheck className="size-8 text-primary" /><div><p className="text-2xl font-bold">{assigned}</p><p className="text-sm text-muted-foreground">Déjà affectés</p></div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="space-y-5 p-5">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px_240px_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-3.5 size-4 text-muted-foreground" />
              <Input className="h-11 pl-10" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher dans les résultats affichés" />
            </div>
            <Select value={type} onValueChange={(value) => { setType(value ?? "TOUS"); setPage(1) }}>
              <SelectTrigger className="h-11 w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TOUS">Tous les types</SelectItem>
                {Object.entries(TYPE_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(value) => { setStatus(value ?? "TOUS"); setPage(1) }}>
              <SelectTrigger className="h-11 w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TOUS">Tous les statuts</SelectItem>
                {Object.entries(STATUS_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" className="h-11" onClick={() => { setSearch(""); setType("TOUS"); setStatus("TOUS"); setPage(1) }}>Réinitialiser</Button>
          </div>

          {error && <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive">{error}</div>}
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
              <LoaderCircle className="size-7 animate-spin text-primary" />
              <div>
                <p className="font-medium">Chargement des immergés centralisés…</p>
                <p className="text-sm text-muted-foreground">La liste affiche les personnes déjà créées dans la table centrale des immergés.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border">
              <Table>
                <TableHeader><TableRow><TableHead>Immergé</TableHead><TableHead>Type</TableHead><TableHead>Référence</TableHead><TableHead>Code FasoIM</TableHead><TableHead>Statut</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filtered.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary"><CircleUserRound className="size-4" /></span><div><p className="font-semibold">{item.source_resume?.identite_affichable || `Immergé #${item.id}`}</p><p className="text-sm text-muted-foreground">{item.source_resume?.telephone || item.source_resume?.email || "Coordonnées non renseignées"}</p></div></div></TableCell>
                      <TableCell>{TYPE_LABELS[item.type_immerge]}</TableCell>
                      <TableCell>{item.source_resume?.reference || "—"}</TableCell>
                      <TableCell className="font-medium">{item.code_fasoim || "Non généré"}</TableCell>
                      <TableCell>{statusBadge(item.statut)}</TableCell>
                    </TableRow>
                  ))}
                  {!filtered.length && <TableRow><TableCell colSpan={5} className="py-12 text-center text-muted-foreground">Aucun immergé ne correspond aux critères.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          )}

          {!loading && !error && total > pageSize && (
            <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Affichage {page} sur {totalPages} · {total} immergés au total
              </p>
              <div className="flex gap-2">
                <Button type="button" variant="outline" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Précédent</Button>
                <Button type="button" variant="outline" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Suivant</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
