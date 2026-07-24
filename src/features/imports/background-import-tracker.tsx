import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { CheckCircle2, LoaderCircle, XCircle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import { importsApi } from "./api"
import type { OfficialImport, Progress } from "./types"
import { readTrackedIds, writeTrackedIds } from "./background-import-tracking"

const ACTIVE_STATUSES = new Set([
  "RECU",
  "LECTURE_COLONNES_EN_COURS",
  "VALIDATION_EN_COURS",
  "CONFIRMATION_EN_COURS",
])

type TrackedImport = {
  id: number
  item: OfficialImport | null
  progress: Progress | null
  unreachable: boolean
}

export function BackgroundImportTracker() {
  const [tracked, setTracked] = useState<TrackedImport[]>([])

  const refresh = useCallback(async () => {
    const ids = readTrackedIds()

    if (!ids.length) {
      setTracked([])
      return
    }

    const results = await Promise.all(
      ids.map(async (id): Promise<TrackedImport> => {
        try {
          const [item, progress] = await Promise.all([
            importsApi.detail(id),
            importsApi.progress(id).catch(() => null),
          ])

          return { id, item, progress, unreachable: false }
        } catch {
          return { id, item: null, progress: null, unreachable: true }
        }
      }),
    )

    const remaining: number[] = []

    for (const result of results) {
      if (!result.item) {
        remaining.push(result.id)
        continue
      }

      if (result.item.statut === "TERMINE") {
        toast.success(`Import « ${result.item.nom_fichier_original} » terminé.`)
        continue
      }

      if (result.item.statut === "ECHEC" || result.item.statut === "ANNULE") {
        toast.error(`Import « ${result.item.nom_fichier_original} » arrêté.`)
        continue
      }

      remaining.push(result.id)
    }

    if (remaining.length !== ids.length) {
      writeTrackedIds(remaining)
    }

    setTracked(
      results.filter((result) => remaining.includes(result.id)),
    )
  }, [])

  useEffect(() => {
    const initial = window.setTimeout(() => void refresh(), 0)
    const timer = window.setInterval(() => void refresh(), 3000)
    const sync = () => void refresh()

    window.addEventListener("storage", sync)
    window.addEventListener("fasoim:background-imports-changed", sync)

    return () => {
      window.clearTimeout(initial)
      window.clearInterval(timer)
      window.removeEventListener("storage", sync)
      window.removeEventListener("fasoim:background-imports-changed", sync)
    }
  }, [refresh])

  if (!tracked.length) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[min(28rem,calc(100vw-2rem))] space-y-3">
      {tracked.map(({ id, item, progress, unreachable }) => {
        const percentage = Math.max(
          0,
          Math.min(100, Number(progress?.pourcentage || 0)),
        )
        const active = item ? ACTIVE_STATUSES.has(item.statut) : true

        return (
          <Card key={id} className="border-primary/25 shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {unreachable ? (
                  <XCircle className="mt-0.5 size-5 text-destructive" />
                ) : active ? (
                  <LoaderCircle className="mt-0.5 size-5 animate-spin text-primary" />
                ) : (
                  <CheckCircle2 className="mt-0.5 size-5 text-primary" />
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {item?.nom_fichier_original || `Import n° ${id}`}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {unreachable
                      ? "Suivi temporairement indisponible. Nouvelle tentative automatique."
                      : progress?.message || "Import traité en arrière-plan. Vous pouvez continuer à travailler."}
                  </p>

                  {!unreachable && (
                    <>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <span className="text-xs font-medium text-primary">
                          {percentage} %
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          render={<Link to={`/app/imports/${id}`} />}
                        >
                          Voir le suivi
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
