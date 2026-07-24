import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, BedDouble, ChevronLeft, ChevronRight, CircleUserRound, LoaderCircle, Search, Users, UserRound, UserRoundCheck } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { getApiErrorMessage } from "@/api/api-error"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { affectationsApi } from "@/features/affectations/api"
import type { CenterAssignment, CenterAssignmentStats } from "@/features/affectations/types"
import { useAuthStore } from "@/stores/auth-store"

const PAGE_SIZE = 50
const TYPE_LABELS: Record<string, string> = { BEPC: "BEPC", BAC: "BAC", CONCOURS: "Concours", SELECTIONNE: "Sélectionné", VOLONTAIRE: "Volontaire" }

function normaliserSexe(value?: string) {
  const sexe = (value ?? "").trim().toUpperCase()
  if (["M", "H", "HOMME", "MASCULIN"].includes(sexe)) return "M"
  if (["F", "FEMME", "FEMININ", "FÉMININ"].includes(sexe)) return "F"
  return ""
}

function etatOrganisation(item: CenterAssignment) {
  const groupe = Boolean(item.organisation_interne?.groupe)
  const lit = Boolean(item.organisation_interne?.lit)
  if (groupe && lit) return "COMPLETE"
  if (groupe || lit) return "PARTIELLE"
  return "NON_ORGANISEE"
}

function organisationBadge(item: CenterAssignment) {
  const etat = etatOrganisation(item)
  if (etat === "COMPLETE") return <Badge className="bg-primary/10 text-primary hover:bg-primary/10">Complète</Badge>
  if (etat === "PARTIELLE") return <Badge variant="secondary">Partielle</Badge>
  return <Badge variant="outline">À organiser</Badge>
}

export function CenterImmergesPage() {
  const navigate = useNavigate()
  const assignment = useAuthStore((state) => state.context?.affectation_courante)
  const [items, setItems] = useState<CenterAssignment[]>([])
  const [stats, setStats] = useState<CenterAssignmentStats | null>(null)
  const [loadingList, setLoadingList] = useState(true)
  const [loadingStats, setLoadingStats] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [type, setType] = useState("TOUS")
  const [sexe, setSexe] = useState("TOUS")
  const [organisation, setOrganisation] = useState("TOUS")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const centerId = assignment?.centre_id ?? 0
  const sessionId = assignment?.session?.id ?? 0

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    let active = true
    async function loadStats() {
      setLoadingStats(true)
      try {
        if (!centerId || !sessionId) return
        const data = await affectationsApi.centerAssignmentStats({ session_id: sessionId, centre_id: centerId, statut: "ACTIVE" })
        if (active) setStats(data)
      } catch (exception) {
        if (active) setError(getApiErrorMessage(exception))
      } finally {
        if (active) setLoadingStats(false)
      }
    }
    void loadStats()
    return () => { active = false }
  }, [assignment?.id, centerId, sessionId])

  useEffect(() => {
    let active = true
    async function loadPage() {
      setLoadingList(true)
      setError("")
      try {
        if (!centerId || !sessionId) {
          if (active) { setItems([]); setTotal(0) }
          return
        }
        const data = await affectationsApi.centerAssignmentsPage({
          session_id: sessionId,
          centre_id: centerId,
          statut: "ACTIVE",
          page,
          page_size: PAGE_SIZE,
          recherche: debouncedSearch || undefined,
          type_immerge: type === "TOUS" ? undefined : type,
        })
        if (active) { setItems(data.results); setTotal(data.count) }
      } catch (exception) {
        if (active) setError(getApiErrorMessage(exception))
      } finally {
        if (active) setLoadingList(false)
      }
    }
    void loadPage()
    return () => { active = false }
  }, [assignment?.id, centerId, sessionId, page, debouncedSearch, type])

  const filtered = useMemo(() => items.filter((item) => {
    const matchesSexe = sexe === "TOUS" || normaliserSexe(item.profil_source?.sexe) === sexe
    const matchesOrganisation = organisation === "TOUS" || etatOrganisation(item) === organisation
    return matchesSexe && matchesOrganisation
  }), [items, organisation, sexe])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const centreNom = stats?.centre_nom || items[0]?.centre.nom || "votre centre"
  const sessionNom = assignment?.session?.nom || assignment?.session?.code || "la session courante"
  const cardValue = (value?: number) => loadingStats ? <LoaderCircle className="size-5 animate-spin text-primary" /> : value ?? 0

  return <div className="space-y-6">
    <header>
      <Button type="button" variant="ghost" className="mb-3 h-10 gap-2 px-0 text-base" onClick={() => navigate(-1)}><ArrowLeft className="size-5" /> Retour</Button>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Responsable de centre</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">Immergés du {centreNom}</h1>
      <p className="mt-2 text-muted-foreground">Consultez les immergés officiellement affectés au centre pour {sessionNom}.</p>
    </header>

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card><CardContent className="flex items-center gap-4 p-5"><Users className="size-8 text-primary" /><div><div className="text-2xl font-bold">{cardValue(stats?.total)}</div><p className="text-sm text-muted-foreground">Total affecté au centre</p></div></CardContent></Card>
      <Card><CardContent className="flex items-center gap-4 p-5"><UserRound className="size-8 text-primary" /><div><div className="text-2xl font-bold">{cardValue(stats?.hommes)}</div><p className="text-sm text-muted-foreground">Hommes</p></div></CardContent></Card>
      <Card><CardContent className="flex items-center gap-4 p-5"><UserRoundCheck className="size-8 text-primary" /><div><div className="text-2xl font-bold">{cardValue(stats?.femmes)}</div><p className="text-sm text-muted-foreground">Femmes</p></div></CardContent></Card>
      <Card><CardContent className="flex items-center gap-4 p-5"><BedDouble className="size-8 text-primary" /><div><div className="text-2xl font-bold">{cardValue(stats?.a_organiser)}</div><p className="text-sm text-muted-foreground">À organiser</p></div></CardContent></Card>
    </section>

    <Card><CardContent className="space-y-5 p-5">
      <div className="grid gap-3 lg:grid-cols-[minmax(280px,1fr)_190px_170px_220px_auto]">
        <div className="relative"><Search className="absolute left-3 top-3.5 size-4 text-muted-foreground" /><Input className="h-11 pl-10" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Code FasoIM, identité ou référence" /></div>
        <Select value={type} onValueChange={(value) => setType(value ?? "TOUS")}><SelectTrigger className="h-11 w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="TOUS">Tous les types</SelectItem>{Object.entries(TYPE_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
        <Select value={sexe} onValueChange={(value) => setSexe(value ?? "TOUS")}><SelectTrigger className="h-11 w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="TOUS">Tous les sexes</SelectItem><SelectItem value="M">Masculin</SelectItem><SelectItem value="F">Féminin</SelectItem></SelectContent></Select>
        <Select value={organisation} onValueChange={(value) => setOrganisation(value ?? "TOUS")}><SelectTrigger className="h-11 w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="TOUS">Toute organisation</SelectItem><SelectItem value="NON_ORGANISEE">À organiser</SelectItem><SelectItem value="PARTIELLE">Partielle</SelectItem><SelectItem value="COMPLETE">Complète</SelectItem></SelectContent></Select>
        <Button type="button" variant="outline" className="h-11" onClick={() => { setSearch(""); setType("TOUS"); setSexe("TOUS"); setOrganisation("TOUS"); setPage(1) }}>Réinitialiser</Button>
      </div>

      {error && <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive">{error}</div>}
      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader><TableRow><TableHead>Immergé</TableHead><TableHead>Sexe</TableHead><TableHead>Type</TableHead><TableHead>Section</TableHead><TableHead>Groupe</TableHead><TableHead>Dortoir / lit</TableHead><TableHead>État</TableHead></TableRow></TableHeader>
          <TableBody>
            {loadingList ? <TableRow><TableCell colSpan={7} className="py-12 text-center"><span className="inline-flex items-center gap-3 text-muted-foreground"><LoaderCircle className="size-5 animate-spin text-primary" />Chargement de la page…</span></TableCell></TableRow> : filtered.map((item) => {
              const profil = item.profil_source
              const interne = item.organisation_interne
              const sexeNormalise = normaliserSexe(profil?.sexe)
              return <TableRow key={item.id}>
                <TableCell><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary"><CircleUserRound className="size-4" /></span><div><p className="font-semibold">{profil?.identite_affichable || `Immergé #${item.immerge.id}`}</p><p className="text-sm text-muted-foreground">{item.immerge.code_fasoim || "Code non généré"}</p></div></div></TableCell>
                <TableCell>{sexeNormalise === "M" ? "Masculin" : sexeNormalise === "F" ? "Féminin" : "—"}</TableCell>
                <TableCell>{TYPE_LABELS[item.immerge.type_immerge ?? ""] || item.immerge.type_immerge || "—"}</TableCell>
                <TableCell>{interne?.section?.nom || "Non attribuée"}</TableCell><TableCell>{interne?.groupe?.nom || "Non attribué"}</TableCell>
                <TableCell>{interne?.dortoir ? `${interne.dortoir.nom}${interne.lit ? ` · Lit ${interne.lit.numero_lit}` : ""}` : "Non attribué"}</TableCell>
                <TableCell>{organisationBadge(item)}</TableCell>
              </TableRow>
            })}
            {!loadingList && !filtered.length && <TableRow><TableCell colSpan={7} className="py-12 text-center text-muted-foreground">Aucun immergé ne correspond aux critères sur cette page.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">Page {page} sur {totalPages} · {total} résultat(s) · {PAGE_SIZE} par page</p>
        <div className="flex gap-2"><Button variant="outline" disabled={page <= 1 || loadingList} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft className="mr-1 size-4" />Précédent</Button><Button variant="outline" disabled={page >= totalPages || loadingList} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Suivant<ChevronRight className="ml-1 size-4" /></Button></div>
      </div>
    </CardContent></Card>
  </div>
}
