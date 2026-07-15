/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Search } from "lucide-react"

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

import { importsApi } from "../api"
import { ImportStatusBadge } from "../components"
import { formatBytes, formatDate, SOURCE_LABELS } from "../labels"
import { IMPORT_PERMISSIONS as P } from "../permissions"
import type { OfficialImport } from "../types"

function ImportResultSummary({ item }: { item: OfficialImport }) {
  if (item.statut === "TERMINE") {
    return (
      <div>
        <p className="font-semibold text-primary">
          {item.lignes_importees} importée(s)
        </p>
        <p className="text-sm text-muted-foreground">
          {item.lignes_erreur} erreur(s) · {item.lignes_ignorees} ignorée(s)
        </p>
      </div>
    )
  }

  if (item.statut === "ANNULE") {
    return (
      <div>
        <p className="font-medium">Import annulé</p>
        <p className="text-sm text-muted-foreground">
          {item.total_lignes} ligne(s) détectée(s)
        </p>
      </div>
    )
  }

  return (
    <div>
      <p>{item.lignes_valides} valide(s)</p>
      <p className="text-sm text-muted-foreground">
        {item.lignes_erreur} erreur(s) · {item.lignes_ignorees} ignorée(s)
      </p>
    </div>
  )
}

export function ImportsListPage() {
  const [rows, setRows] = useState<OfficialImport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("")
  const [source, setSource] = useState("")

  async function load() {
    setLoading(true)

    try {
      setRows(
        await importsApi.list({
          statut: status || undefined,
          type_source: source || undefined,
        }),
      )
      setError("")
    } catch (e) {
      setError(getApiErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase()

    if (!value) return rows

    return rows.filter((item) =>
      [
        item.nom_fichier_original,
        item.session_code,
        item.session_libelle,
        item.importe_par_nom,
      ].some((field) => field?.toLowerCase().includes(value)),
    )
  }, [query, rows])

  return (
    <>
      <PageHeader
        title="Imports officiels"
        description="Téléversez, contrôlez et confirmez les listes officielles avant la création des immergés."
        backTo="/app"
        actionTo="/app/imports/nouveau"
        actionLabel="Nouvel import"
        actionPermission={P.CREATE}
      />

      <Card className="mb-6 p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px_auto]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-12 pl-12"
              placeholder="Fichier, session ou importateur"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <select
            className="h-12 rounded-xl border bg-background px-3"
            value={source}
            onChange={(event) => setSource(event.target.value)}
          >
            <option value="">Toutes les sources</option>
            {Object.entries(SOURCE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <select
            className="h-12 rounded-xl border bg-background px-3"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">Tous les statuts</option>
            <option value="CORRESPONDANCE_REQUISE">
              Correspondance requise
            </option>
            <option value="VALIDATION_EN_COURS">Validation en cours</option>
            <option value="VALIDE">Valide</option>
            <option value="VALIDE_AVEC_ERREURS">Avec erreurs</option>
            <option value="CONFIRMATION_EN_COURS">
              Confirmation en cours
            </option>
            <option value="TERMINE">Terminé</option>
            <option value="ECHEC">Échec</option>
            <option value="ANNULE">Annulé</option>
          </select>

          <Button className="h-12" onClick={() => void load()}>
            Filtrer
          </Button>
        </div>
      </Card>

      {error && <ErrorBox message={error} />}

      {loading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <EmptyState message="Aucun import officiel trouvé." />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-5">Fichier</TableHead>
                <TableHead>Session</TableHead>
                <TableHead>Résultats</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>

            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="px-5">
                    <p className="font-semibold">
                      {item.nom_fichier_original}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {SOURCE_LABELS[item.type_source]} ·{" "}
                      {formatBytes(item.taille_fichier)}
                    </p>
                  </TableCell>

                  <TableCell>
                    {item.session_libelle}
                    <p className="text-sm text-muted-foreground">
                      {item.session_code}
                    </p>
                  </TableCell>

                  <TableCell>
                    <ImportResultSummary item={item} />
                  </TableCell>

                  <TableCell>
                    <ImportStatusBadge status={item.statut} />
                  </TableCell>

                  <TableCell>{formatDate(item.date_import)}</TableCell>

                  <TableCell className="text-right">
                    <Button
                      render={<Link to={`/app/imports/${item.id}`} />}
                      variant="outline"
                    >
                      Consulter
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </>
  )
}
