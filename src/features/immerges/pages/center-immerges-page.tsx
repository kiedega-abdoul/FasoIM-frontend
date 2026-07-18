import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, BedDouble, CircleUserRound, LoaderCircle, Search, Users, UserRound, UserRoundCheck } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { getApiErrorMessage } from "@/api/api-error"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { affectationsApi } from "@/features/affectations/api"
import type { CenterAssignment } from "@/features/affectations/types"
import { useAuthStore } from "@/stores/auth-store"

const TYPE_LABELS: Record<string, string> = {
  BEPC: "BEPC",
  BAC: "BAC",
  CONCOURS: "Concours",
  SELECTIONNE: "Sélectionné",
  VOLONTAIRE: "Volontaire",
}

function normaliserSexe(value?: string) {
  const sexe = (value ?? "").trim().toUpperCase()
  if (["M", "H", "HOMME", "MASCULIN"].includes(sexe)) return "M"
  if (["F", "FEMME", "FEMININ", "FÉMININ"].includes(sexe)) return "F"
  return ""
}

function etatOrganisation(item: CenterAssignment) {
  const organisation = item.organisation_interne
  const groupe = Boolean(organisation?.groupe)
  const lit = Boolean(organisation?.lit)
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [type, setType] = useState("TOUS")
  const [sexe, setSexe] = useState("TOUS")
  const [organisation, setOrganisation] = useState("TOUS")

  const centerId = assignment?.centre_id ?? 0
  const sessionId = assignment?.session?.id ?? 0

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError("")
      try {
        if (!centerId || !sessionId) {
          if (active) setItems([])
          return
        }
        const data = await affectationsApi.centerAssignments({
          session_id: sessionId,
          centre_id: centerId,
          statut: "ACTIVE",
        })
        if (active) setItems(data)
      } catch (exception) {
        if (active) setError(getApiErrorMessage(exception))
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => { active = false }
  }, [assignment?.id, centerId, sessionId])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return items.filter((item) => {
      const profil = item.profil_source
      const matchesSearch = !query || [
        item.immerge.code_fasoim,
        profil?.identite_affichable,
        profil?.identifiant_source,
        item.centre.nom,
      ].some((value) => value?.toLowerCase().includes(query))
      const matchesType = type === "TOUS" || item.immerge.type_immerge === type
      const matchesSexe = sexe === "TOUS" || normaliserSexe(profil?.sexe) === sexe
      const matchesOrganisation = organisation === "TOUS" || etatOrganisation(item) === organisation
      return matchesSearch && matchesType && matchesSexe && matchesOrganisation
    })
  }, [items, organisation, search, sexe, type])

  const hommes = items.filter((item) => normaliserSexe(item.profil_source?.sexe) === "M").length
  const femmes = items.filter((item) => normaliserSexe(item.profil_source?.sexe) === "F").length
  const aOrganiser = items.filter((item) => etatOrganisation(item) !== "COMPLETE").length
  const centreNom = items[0]?.centre.nom || "votre centre"
  const sessionNom = assignment?.session?.nom || assignment?.session?.code || "la session courante"

  return <div className="space-y-6">
    <header>
      <Button type="button" variant="ghost" className="mb-3 h-10 gap-2 px-0 text-base" onClick={() => navigate(-1)}>
        <ArrowLeft className="size-5" /> Retour
      </Button>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Responsable de centre</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">Immergés du {centreNom}</h1>
      <p className="mt-2 text-muted-foreground">Consultez les immergés officiellement affectés au centre pour {sessionNom}.</p>
    </header>

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card><CardContent className="flex items-center gap-4 p-5"><Users className="size-8 text-primary" /><div><p className="text-2xl font-bold">{items.length}</p><p className="text-sm text-muted-foreground">Total affecté au centre</p></div></CardContent></Card>
      <Card><CardContent className="flex items-center gap-4 p-5"><UserRound className="size-8 text-primary" /><div><p className="text-2xl font-bold">{hommes}</p><p className="text-sm text-muted-foreground">Hommes</p></div></CardContent></Card>
      <Card><CardContent className="flex items-center gap-4 p-5"><UserRoundCheck className="size-8 text-primary" /><div><p className="text-2xl font-bold">{femmes}</p><p className="text-sm text-muted-foreground">Femmes</p></div></CardContent></Card>
      <Card><CardContent className="flex items-center gap-4 p-5"><BedDouble className="size-8 text-primary" /><div><p className="text-2xl font-bold">{aOrganiser}</p><p className="text-sm text-muted-foreground">À organiser</p></div></CardContent></Card>
    </section>

    <Card>
      <CardContent className="space-y-5 p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_190px_170px_220px_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-3.5 size-4 text-muted-foreground" />
            <Input className="h-11 pl-10" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Code FasoIM, identité ou référence" />
          </div>
          <Select value={type} onValueChange={(value) => setType(value ?? "TOUS")}>
            <SelectTrigger className="h-11 w-full"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="TOUS">Tous les types</SelectItem>{Object.entries(TYPE_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={sexe} onValueChange={(value) => setSexe(value ?? "TOUS")}>
            <SelectTrigger className="h-11 w-full"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="TOUS">Tous les sexes</SelectItem><SelectItem value="M">Masculin</SelectItem><SelectItem value="F">Féminin</SelectItem></SelectContent>
          </Select>
          <Select value={organisation} onValueChange={(value) => setOrganisation(value ?? "TOUS")}>
            <SelectTrigger className="h-11 w-full"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="TOUS">Toute organisation</SelectItem><SelectItem value="NON_ORGANISEE">À organiser</SelectItem><SelectItem value="PARTIELLE">Partielle</SelectItem><SelectItem value="COMPLETE">Complète</SelectItem></SelectContent>
          </Select>
          <Button type="button" variant="outline" className="h-11" onClick={() => { setSearch(""); setType("TOUS"); setSexe("TOUS"); setOrganisation("TOUS") }}>Réinitialiser</Button>
        </div>

        {error && <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive">{error}</div>}
        {loading ? <div className="flex flex-col items-center justify-center gap-3 py-14"><LoaderCircle className="size-7 animate-spin text-primary" /><p className="text-muted-foreground">Chargement des immergés du centre…</p></div> : (
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader><TableRow><TableHead>Immergé</TableHead><TableHead>Sexe</TableHead><TableHead>Type</TableHead><TableHead>Section</TableHead><TableHead>Groupe</TableHead><TableHead>Dortoir / lit</TableHead><TableHead>État</TableHead></TableRow></TableHeader>
              <TableBody>
                {filtered.map((item) => {
                  const profil = item.profil_source
                  const interne = item.organisation_interne
                  const sexeNormalise = normaliserSexe(profil?.sexe)
                  return <TableRow key={item.id}>
                    <TableCell><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary"><CircleUserRound className="size-4" /></span><div><p className="font-semibold">{profil?.identite_affichable || `Immergé #${item.immerge.id}`}</p><p className="text-sm text-muted-foreground">{item.immerge.code_fasoim || "Code non généré"}</p></div></div></TableCell>
                    <TableCell>{sexeNormalise === "M" ? "Masculin" : sexeNormalise === "F" ? "Féminin" : "—"}</TableCell>
                    <TableCell>{TYPE_LABELS[item.immerge.type_immerge ?? ""] || item.immerge.type_immerge || "—"}</TableCell>
                    <TableCell>{interne?.section?.nom || "Non attribuée"}</TableCell>
                    <TableCell>{interne?.groupe?.nom || "Non attribué"}</TableCell>
                    <TableCell>{interne?.dortoir ? `${interne.dortoir.nom}${interne.lit ? ` · Lit ${interne.lit.numero_lit}` : ""}` : "Non attribué"}</TableCell>
                    <TableCell>{organisationBadge(item)}</TableCell>
                  </TableRow>
                })}
                {!filtered.length && <TableRow><TableCell colSpan={7} className="py-12 text-center text-muted-foreground">Aucun immergé ne correspond aux critères.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  </div>
}
