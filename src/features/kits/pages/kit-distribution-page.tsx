/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from "react"
import { useParams, useSearchParams } from "react-router-dom"
import { Search, UsersRound } from "lucide-react"

import { getApiErrorMessage } from "@/api/api-error"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { affectationsApi } from "@/features/affectations/api"
import { currentCenterId } from "@/features/affectations/scope"
import type { CenterAssignment } from "@/features/affectations/types"
import { EmptyState, ErrorBox, Loading, PageHeader, StatusBadge } from "@/features/accounts/components"
import { useAuthStore } from "@/stores/auth-store"
import { kitsApi } from "../api"
import type { KitArticle, KitRemise } from "../types"

export function KitDistributionPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const assignment = useAuthStore((state) => state.context?.affectation_courante)
  const sessionId = assignment?.session?.id ?? (Number(searchParams.get("session_id")) || 0)
  const centreId = Number(assignment?.centre_id || currentCenterId() || 0)
  const articleId = Number(id || 0)

  const [article, setArticle] = useState<KitArticle | null>(null)
  const [immerges, setImmerges] = useState<CenterAssignment[]>([])
  const [remises, setRemises] = useState<KitRemise[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")

  async function load() {
    if (!articleId || !sessionId || !centreId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError("")
    try {
      const [articleRow, assignmentRows, remiseRows] = await Promise.all([
        kitsApi.article(articleId),
        affectationsApi.centerAssignments({ session_id: sessionId, centre_id: centreId, statut: "ACTIVE" }),
        kitsApi.remises({ session_id: sessionId, centre_id: centreId }),
      ])
      setArticle(articleRow)
      setImmerges(assignmentRows)
      setRemises(remiseRows)
    } catch (exception) {
      setError(getApiErrorMessage(exception))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [articleId, sessionId, centreId])

  const alreadyRemittedIds = useMemo(() => {
    const values = new Set<number>()
    for (const remise of remises) {
      if (remise.article_kit.id !== articleId) continue
      if (["REMIS", "REMPLACE", "DISPENSE"].includes(remise.statut_remise)) values.add(remise.affectation_centre.id)
    }
    return values
  }, [articleId, remises])

  const filteredImmerges = useMemo(() => {
    const value = query.trim().toLowerCase()
    return immerges.filter((item) => !value || [
      item.profil_source?.identite_affichable,
      item.immerge.code_fasoim,
      item.immerge.type_immerge,
    ].filter(Boolean).some((entry) => String(entry).toLowerCase().includes(value)))
  }, [immerges, query])

  function toggle(idValue: number) {
    if (alreadyRemittedIds.has(idValue)) return
    setSelectedIds((current) => current.includes(idValue)
      ? current.filter((value) => value !== idValue)
      : [...current, idValue])
  }

  function toggleAllVisible() {
    const eligible = filteredImmerges.filter((item) => !alreadyRemittedIds.has(item.id)).map((item) => item.id)
    const allSelected = eligible.length > 0 && eligible.every((value) => selectedIds.includes(value))
    setSelectedIds(allSelected
      ? selectedIds.filter((value) => !eligible.includes(value))
      : Array.from(new Set([...selectedIds, ...eligible])))
  }

  async function distributeNow() {
    if (!article || selectedIds.length === 0) return
    setBusy(true)
    setError("")
    setInfo("")
    try {
      const task = await kitsApi.validateMass({
        session_id: sessionId,
        centre_id: centreId,
        affectation_centre_ids: selectedIds,
        article_kit_ids: [article.id],
      })
      setInfo(task.message || "La distribution a été lancée.")
      for (let attempt = 0; attempt < 120; attempt += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 1000))
        const progress = await kitsApi.operationProgress(task.task_id)
        setInfo(progress.message || `Distribution en cours : ${progress.progression}%`)
        if (["TERMINEE", "TERMINE", "SUCCESS"].includes(String(progress.statut).toUpperCase())) {
          setInfo(`Distribution de « ${article.designation} » terminée.`)
          setSelectedIds([])
          await load()
          break
        }
        if (["ECHEC", "ECHOUEE", "FAILED", "REFUSEE"].includes(String(progress.statut).toUpperCase())) {
          throw new Error(progress.message || "La distribution n'a pas pu être terminée.")
        }
      }
    } catch (exception) {
      setError(getApiErrorMessage(exception))
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <Loading />
  if (!article) return <><PageHeader title="Distribution d’un kit" backTo="/app/kits?type=A_REMETTRE" /><EmptyState message="Article introuvable ou contexte incomplet." /></>

  return <>
    <PageHeader
      title={`Distribuer : ${article.designation}`}
      description={`Sélectionnez les immergés du centre qui reçoivent ${article.quantite} ${article.unite}.`}
      backTo="/app/kits?type=A_REMETTRE"
    />

    <Card className="mb-5"><CardContent className="grid gap-5 p-6 md:grid-cols-3">
      <div><p className="text-sm text-muted-foreground">Article</p><p className="mt-1 text-lg font-bold">{article.designation}</p></div>
      <div><p className="text-sm text-muted-foreground">Quantité</p><p className="mt-1 text-lg font-bold">{article.quantite} {article.unite}</p></div>
      <div><p className="text-sm text-muted-foreground">Déjà remis</p><p className="mt-1 text-lg font-bold">{alreadyRemittedIds.size} / {immerges.length}</p></div>
    </CardContent></Card>

    <Card className="mb-5 p-5"><div className="relative"><Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" /><Input className="h-12 rounded-xl pl-12 text-base" placeholder="Rechercher un immergé" value={query} onChange={(event) => setQuery(event.target.value)} /></div></Card>
    {error && <div className="mb-5"><ErrorBox message={error} /></div>}
    {info && <div className="mb-5 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm text-primary">{info}</div>}

    {filteredImmerges.length === 0 ? <EmptyState message="Aucun immergé affecté au centre." /> : <Card className="overflow-hidden"><Table><TableHeader><TableRow><TableHead className="w-14 px-5"><input type="checkbox" aria-label="Sélectionner tous les immergés visibles" checked={filteredImmerges.some((item) => !alreadyRemittedIds.has(item.id)) && filteredImmerges.filter((item) => !alreadyRemittedIds.has(item.id)).every((item) => selectedIds.includes(item.id))} onChange={toggleAllVisible} /></TableHead><TableHead>Immergé</TableHead><TableHead>Code FasoIM</TableHead><TableHead>Type</TableHead><TableHead>État</TableHead></TableRow></TableHeader><TableBody>{filteredImmerges.map((item) => {
      const alreadyRemitted = alreadyRemittedIds.has(item.id)
      return <TableRow key={item.id} className={alreadyRemitted ? "opacity-60" : ""}><TableCell className="px-5"><input type="checkbox" aria-label={`Sélectionner ${item.profil_source?.identite_affichable || item.immerge.code_fasoim || item.id}`} disabled={alreadyRemitted} checked={selectedIds.includes(item.id)} onChange={() => toggle(item.id)} /></TableCell><TableCell className="font-semibold">{item.profil_source?.identite_affichable || `Immergé #${item.immerge.id}`}</TableCell><TableCell>{item.immerge.code_fasoim || "—"}</TableCell><TableCell>{item.immerge.type_immerge || "—"}</TableCell><TableCell><StatusBadge value={alreadyRemitted ? "remis" : "non_remis"} /></TableCell></TableRow>
    })}</TableBody></Table></Card>}

    <Card className="mt-6"><CardContent className="p-6"><div className="mb-4 flex items-center gap-3"><UsersRound className="size-7 text-primary" /><div><p className="text-lg font-bold">{selectedIds.length} immergé(s) sélectionné(s)</p><p className="text-sm text-muted-foreground">Seul l’article « {article.designation} » sera enregistré comme remis.</p></div></div><Button className="h-16 w-full rounded-2xl text-lg font-bold" disabled={busy || selectedIds.length === 0} onClick={() => void distributeNow()}>{busy ? "Distribution en cours…" : "Distribuer maintenant"}</Button></CardContent></Card>
  </>
}
