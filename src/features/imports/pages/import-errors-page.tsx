/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { Search } from "lucide-react"

import { getApiErrorMessage } from "@/api/api-error"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState, ErrorBox, Loading, PageHeader } from "@/features/accounts/components"

import { importsApi } from "../api"
import type { ImportError } from "../types"

export function ImportErrorsPage() {
  const { id } = useParams()
  const importId = Number(id)
  const [rows, setRows] = useState<ImportError[]>([])
  const [gravity, setGravity] = useState("")
  const [query, setQuery] = useState("")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [count, setCount] = useState(0)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const pageSize = 50

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await importsApi.errors(importId, {
        page,
        page_size: pageSize,
        gravite: gravity,
        search,
      })
      setRows(response.results)
      setCount(response.count)
      setError("")
    } catch (e) {
      setError(getApiErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [importId, page, gravity, search])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1)
      setSearch(query.trim())
    }, 350)
    return () => window.clearTimeout(timer)
  }, [query])

  useEffect(() => {
    void load()
  }, [load])

  const totalPages = Math.max(1, Math.ceil(count / pageSize))

  return (
    <>
      <PageHeader
        title="Erreurs de l’import"
        description="Les erreurs bloquantes doivent être corrigées ou les lignes concernées doivent être ignorées avec justification."
        backTo={`/app/imports/${importId}`}
      />

      <Card className="mb-5">
        <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-11 pl-9"
              placeholder="Rechercher par ligne, information, message ou valeur"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <select
            className="h-11 rounded-xl border bg-background px-3"
            value={gravity}
            onChange={(event) => {
              setGravity(event.target.value)
              setPage(1)
            }}
          >
            <option value="">Toutes les gravités</option>
            <option value="BLOQUANTE">Bloquantes</option>
            <option value="AVERTISSEMENT">Avertissements</option>
          </select>

          <Button render={<Link to={`/app/imports/${importId}/lignes`} />} variant="outline">
            Ouvrir les lignes
          </Button>
        </CardContent>
      </Card>

      {error && <ErrorBox message={error} />}
      {loading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <EmptyState message="Aucune erreur détectée." />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-5">Ligne</TableHead>
                <TableHead>Gravité</TableHead>
                <TableHead>Information concernée</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Valeur reçue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="px-5 font-semibold">{row.numero_ligne}</TableCell>
                  <TableCell>
                    <Badge variant={row.gravite === "BLOQUANTE" ? "destructive" : "secondary"}>
                      {row.gravite_libelle}
                    </Badge>
                  </TableCell>
                  <TableCell>{row.champ_cible || row.colonne_source || "Ligne"}</TableCell>
                  <TableCell>{row.type_erreur_libelle}</TableCell>
                  <TableCell>{row.message}</TableCell>
                  <TableCell className="max-w-xs break-all text-sm text-muted-foreground">
                    {row.valeur_recue || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {!loading && count > 0 && (
        <div className="mt-4 flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {count.toLocaleString("fr-FR")} erreur(s) · affichage {page} sur {totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
              Précédente
            </Button>
            <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
              Suivante
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
