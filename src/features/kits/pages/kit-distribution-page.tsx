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
  const [refreshing, setRefreshing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")
  const [confirmAllOpen, setConfirmAllOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [totalImmerges, setTotalImmerges] = useState(0)
  const [totalRemis, setTotalRemis] = useState(0)
  const pageSize = 50
  const totalRestant = Math.max(0, totalImmerges - totalRemis)

  async function load(options?: { silent?: boolean }) {
    if (!articleId || !sessionId || !centreId) {
      setLoading(false)
      return
    }

    const silent = options?.silent ?? article !== null

    if (silent) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    setError("")

    try {
      const [articleRow, assignmentPage, remiseRows, statsRows] =
        await Promise.all([
          kitsApi.article(articleId),
          affectationsApi.centerAssignmentsPage({
            session_id: sessionId,
            centre_id: centreId,
            statut: "ACTIVE",
            page,
            page_size: pageSize,
          }),
          kitsApi.remises({
            session_id: sessionId,
            centre_id: centreId,
            article_kit_id: articleId,
            page_size: 200,
          }),
          kitsApi.stats({
            session_id: sessionId,
            centre_id: centreId,
            article_kit_id: articleId,
          }),
        ])
      setArticle(articleRow)
      setImmerges(assignmentPage.results)
      setTotalImmerges(assignmentPage.count)
      setRemises(remiseRows)

      const completes = statsRows
        .filter((row) =>
          ["REMIS", "REMPLACE", "DISPENSE"].includes(
            row.statut_remise,
          ),
        )
        .reduce((total, row) => total + row.total, 0)

      setTotalRemis(completes)
    } catch (exception) {
      setError(getApiErrorMessage(exception))
    } finally {
      if (silent) {
        setRefreshing(false)
      } else {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    void load({ silent: article !== null })
  }, [articleId, sessionId, centreId, page])

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

  async function distributeAll() {
    if (!article) return

    setConfirmAllOpen(false)
    setBusy(true)
    setError("")
    setInfo("Préparation de la distribution générale…")

    try {
      const task = await kitsApi.validateMass({
        session_id: sessionId,
        centre_id: centreId,
        article_kit_ids: [article.id],
      })

      setInfo(
        task.message ||
          "La distribution à tout le centre a été lancée. Vous pouvez lancer un autre article.",
      )

      // La tâche continue dans Celery. L’interface peut immédiatement
      // servir à lancer la distribution d’un autre article.
      setBusy(false)

      for (let attempt = 0; attempt < 600; attempt += 1) {
        await new Promise((resolve) =>
          window.setTimeout(resolve, 1000),
        )

        const progress = await kitsApi.operationProgress(
          task.task_id,
        )

        setInfo(
          progress.message ||
            `Distribution générale en cours : ${progress.progression}%`,
        )

        const statut = String(progress.statut).toUpperCase()

        if (
          ["TERMINEE", "TERMINE", "SUCCESS"].includes(statut)
        ) {
          setInfo(
            `Distribution de « ${article.designation} » terminée pour le centre.`,
          )
          setSelectedIds([])
          await load({ silent: true })
          break
        }

        if (
          ["ECHEC", "ECHOUEE", "FAILED", "REFUSEE"].includes(
            statut,
          )
        ) {
          throw new Error(
            progress.message ||
              "La distribution générale n’a pas pu être terminée.",
          )
        }
      }
    } catch (exception) {
      setError(getApiErrorMessage(exception))
    } finally {
      setBusy(false)
    }
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
          await load({ silent: true })
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

    <Card className="mb-5">
      <CardContent className="p-6">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="text-sm text-muted-foreground">Article</p>
            <p className="mt-1 text-xl font-bold">
              {article.designation}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {article.quantite} {article.unite} par immergé
            </p>
          </div>

          <div className="rounded-2xl border bg-muted/20 p-4">
            <p className="text-sm text-muted-foreground">
              Immergés du centre
            </p>
            <p className="mt-1 text-3xl font-bold">
              {totalImmerges}
            </p>
          </div>

          <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4">
            <p className="text-sm text-muted-foreground">
              Article déjà remis
            </p>
            <p className="mt-1 text-3xl font-bold text-primary">
              {totalRemis}
            </p>
          </div>

          <div className="rounded-2xl border p-4">
            <p className="text-sm text-muted-foreground">
              Reste à distribuer
            </p>
            <p className="mt-1 text-3xl font-bold">
              {totalRestant}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between gap-4 text-sm">
            <span className="font-semibold">
              Progression de la distribution
            </span>
            <span className="text-muted-foreground">
              {totalImmerges > 0
                ? Math.round((totalRemis / totalImmerges) * 100)
                : 0} %
            </span>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{
                width: `${
                  totalImmerges > 0
                    ? Math.min(
                        100,
                        Math.round(
                          (totalRemis / totalImmerges) * 100,
                        ),
                      )
                    : 0
                }%`,
              }}
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
            <span>
              Page {page} : {immerges.length} immergé(s) affiché(s)
            </span>

            {refreshing && (
              <span className="font-medium text-primary">
                Actualisation des données…
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>

    <Card className="mb-5 p-5"><div className="relative"><Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" /><Input className="h-12 rounded-xl pl-12 text-base" placeholder="Rechercher un immergé" value={query} onChange={(event) => {
      setQuery(event.target.value)
      setPage(1)
      setSelectedIds([])
    }} /></div></Card>
    {error && <div className="mb-5"><ErrorBox message={error} /></div>}
    {info && <div className="mb-5 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm text-primary">{info}</div>}

    {filteredImmerges.length === 0 ? <EmptyState message="Aucun immergé affecté au centre." /> : <Card className="overflow-hidden"><Table><TableHeader><TableRow><TableHead className="w-14 px-5"><input type="checkbox" aria-label="Sélectionner tous les immergés visibles" checked={filteredImmerges.some((item) => !alreadyRemittedIds.has(item.id)) && filteredImmerges.filter((item) => !alreadyRemittedIds.has(item.id)).every((item) => selectedIds.includes(item.id))} onChange={toggleAllVisible} /></TableHead><TableHead>Immergé</TableHead><TableHead>Code FasoIM</TableHead><TableHead>Type</TableHead><TableHead>État</TableHead></TableRow></TableHeader><TableBody>{filteredImmerges.map((item) => {
      const alreadyRemitted = alreadyRemittedIds.has(item.id)
      return <TableRow key={item.id} className={alreadyRemitted ? "opacity-60" : ""}><TableCell className="px-5"><input type="checkbox" aria-label={`Sélectionner ${item.profil_source?.identite_affichable || item.immerge.code_fasoim || item.id}`} disabled={alreadyRemitted} checked={selectedIds.includes(item.id)} onChange={() => toggle(item.id)} /></TableCell><TableCell className="font-semibold">{item.profil_source?.identite_affichable || `Immergé #${item.immerge.id}`}</TableCell><TableCell>{item.immerge.code_fasoim || "—"}</TableCell><TableCell>{item.immerge.type_immerge || "—"}</TableCell><TableCell><StatusBadge value={alreadyRemitted ? "remis" : "non_remis"} /></TableCell></TableRow>
    })}</TableBody></Table>

      <div className="flex flex-col gap-3 border-t p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-semibold">
          Page {page} sur {Math.max(1, Math.ceil(totalImmerges / pageSize))}
          {" · "}
          {immerges.length} immergé(s)
        </p>

        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={busy || page <= 1}
            onClick={() => {
              setSelectedIds([])
              setPage((current) => Math.max(1, current - 1))
            }}
          >
            Précédente
          </Button>

          <Button
            disabled={
              busy ||
              page >= Math.max(1, Math.ceil(totalImmerges / pageSize))
            }
            onClick={() => {
              setSelectedIds([])
              setPage((current) => current + 1)
            }}
          >
            Suivante
          </Button>
        </div>
      </div>
    </Card>}

    <Card className="mt-6">
      <CardContent className="p-6">
        <div className="mb-5 flex items-center gap-3">
          <UsersRound className="size-7 text-primary" />
          <div>
            <p className="text-lg font-bold">
              {selectedIds.length} immergé(s) sélectionné(s)
            </p>
            <p className="text-sm text-muted-foreground">
              Seul l’article « {article.designation} » sera enregistré comme remis.
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Button
            variant="outline"
            className="h-16 rounded-2xl text-base font-bold"
            disabled={busy || selectedIds.length === 0}
            onClick={() => void distributeNow()}
          >
            Distribuer aux personnes sélectionnées
          </Button>

          <Button
            className="h-16 rounded-2xl text-base font-bold"
            disabled={busy || totalRestant === 0}
            onClick={() => setConfirmAllOpen(true)}
          >
            {busy
              ? "Envoi à Celery…"
              : totalRestant === 0
                ? "Article déjà distribué à tout le centre"
                : `Distribuer aux personnes restantes (${totalRestant})`}
          </Button>
        </div>
      </CardContent>
    </Card>

    {confirmAllOpen && article && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-distribution-title"
        onClick={() => {
          if (!busy) setConfirmAllOpen(false)
        }}
      >
        <div
          className="w-full max-w-xl rounded-3xl border bg-background p-7 shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-primary/10">
            <UsersRound className="size-7 text-primary" />
          </div>

          <h2
            id="confirm-distribution-title"
            className="text-2xl font-bold"
          >
            Confirmer la distribution générale
          </h2>

          <p className="mt-3 text-base leading-7 text-muted-foreground">
            L’article « {article.designation} » sera enregistré comme remis
            à tous les immergés admissibles de ce centre.
          </p>

          <div className="mt-5 rounded-2xl border bg-muted/35 p-5">
            <p className="text-sm text-muted-foreground">
              Nombre d’immergés restant à servir
            </p>
            <p className="mt-1 text-3xl font-bold text-primary">
              {totalRestant}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Le traitement sera exécuté en arrière-plan par lots.
            </p>
          </div>

          <p className="mt-5 text-sm leading-6 text-muted-foreground">
            Les personnes déjà enregistrées comme ayant reçu cet article
            ne seront pas remises une deuxième fois.
          </p>

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              className="h-12 px-6"
              disabled={busy}
              onClick={() => setConfirmAllOpen(false)}
            >
              Annuler
            </Button>

            <Button
              className="h-12 px-6 font-bold"
              disabled={busy}
              onClick={() => void distributeAll()}
            >
              Confirmer la distribution
            </Button>
          </div>
        </div>
      </div>
    )}
  </>
}
