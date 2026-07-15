/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { toast } from "sonner"
import { Eye, Pencil, RotateCcw, Search, UserRound, XCircle } from "lucide-react"

import { getApiErrorMessage } from "@/api/api-error"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState, ErrorBox, Loading, PageHeader } from "@/features/accounts/components"

import { importsApi } from "../api"
import { ImportPermissionGuard } from "../components"
import { IMPORT_PERMISSIONS as P } from "../permissions"
import type { ImportRow } from "../types"

const FIELD_LABELS: Record<string, string> = {
  numero_pv: "Numéro PV",
  numero_recepisse: "Numéro de récépissé",
  matricule: "Matricule",
  nom: "Nom",
  prenoms: "Prénoms",
  sexe: "Sexe",
  date_naissance: "Date de naissance",
  lieu_naissance: "Lieu de naissance",
  nationalite: "Nationalité",
  telephone: "Téléphone",
  email: "Adresse e-mail",
  serie: "Série",
  statut: "Statut d'admission",
  type_examen: "Type d'examen",
  annee_obtention: "Année d'obtention",
  centre_examen: "Centre d'examen",
  etablissement_origine: "Établissement d'origine",
  region_examen: "Région d'examen",
  province_examen: "Province d'examen",
}

const IDENTITY_FIELDS = ["nom", "prenoms", "sexe", "date_naissance", "lieu_naissance", "nationalite"]
const CONTACT_FIELDS = ["telephone", "email"]
const EXAM_FIELDS = ["numero_pv", "numero_recepisse", "matricule", "type_examen", "serie", "statut", "annee_obtention"]
const LOCATION_FIELDS = ["centre_examen", "etablissement_origine", "region_examen", "province_examen"]

function labelFor(key: string) {
  return FIELD_LABELS[key] ?? key.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase())
}

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—"
  if (typeof value === "boolean") return value ? "Oui" : "Non"
  if (Array.isArray(value)) return value.join(", ")
  return String(value)
}

function fullName(row: ImportRow) {
  const data = row.donnees_normalisees
  const name = [data.nom, data.prenoms].filter(Boolean).map(String).join(" ")
  return name || `Ligne ${row.numero_ligne}`
}

function reference(row: ImportRow) {
  const data = row.donnees_normalisees
  return String(data.numero_pv ?? data.numero_recepisse ?? data.matricule ?? "Sans référence")
}

function statusVariant(status: ImportRow["statut"]) {
  if (status === "VALIDE" || status === "IMPORTEE") return "default" as const
  if (status === "ERREUR") return "destructive" as const
  return "outline" as const
}

function fieldsIn(data: Record<string, unknown>, preferred: string[]) {
  return preferred.filter((field) => Object.prototype.hasOwnProperty.call(data, field))
}

function unknownFields(data: Record<string, unknown>) {
  const known = new Set([...IDENTITY_FIELDS, ...CONTACT_FIELDS, ...EXAM_FIELDS, ...LOCATION_FIELDS])
  return Object.keys(data).filter((field) => !known.has(field))
}

function DetailSection({ title, fields, data }: { title: string; fields: string[]; data: Record<string, unknown> }) {
  if (fields.length === 0) return null
  return (
    <section className="rounded-2xl border bg-muted/20 p-4">
      <h3 className="mb-3 font-semibold">{title}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field}>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{labelFor(field)}</p>
            <p className="mt-1 wrap-break-word font-medium">{displayValue(data[field])}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export function ImportRowsPage() {
  const { id } = useParams()
  const importId = Number(id)
  const [rows, setRows] = useState<ImportRow[]>([])
  const [status, setStatus] = useState("")
  const [query, setQuery] = useState("")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [count, setCount] = useState(0)
  const pageSize = 50
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<ImportRow | null>(null)
  const [editing, setEditing] = useState<ImportRow | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [bulkIgnoreOpen, setBulkIgnoreOpen] = useState(false)
  const [bulkReason, setBulkReason] = useState("")
  const [bulkBusy, setBulkBusy] = useState(false)
  const [revalidationBusy, setRevalidationBusy] = useState(false)

  const attendreFinValidation = useCallback(async () => {
    const delai = 1500
    const tentativesMax = 120

    for (let tentative = 0; tentative < tentativesMax; tentative += 1) {
      const importOfficiel = await importsApi.detail(importId)
      if (importOfficiel.statut !== "VALIDATION_EN_COURS") {
        return importOfficiel
      }
      await new Promise((resolve) => window.setTimeout(resolve, delai))
    }

    throw new Error("La validation prend plus de temps que prévu. Rechargez la page pour consulter son état.")
  }, [importId])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await importsApi.rows(importId, {
        page,
        page_size: pageSize,
        statut: status,
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
  }, [importId, page, status, search])

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
  const selectableRows = rows.filter((row) => row.statut !== "IMPORTEE")
  const selectedRows = rows.filter((row) => selectedIds.includes(row.id))
  const selectedIgnoredRows = selectedRows.filter((row) => row.statut === "IGNOREE")
  const selectedIgnorableRows = selectedRows.filter((row) => row.statut !== "IGNOREE")
  const canIgnoreSelection = selectedRows.length > 0 && selectedIgnorableRows.length === selectedRows.length
  const canReintegrateSelection = selectedRows.length > 0 && selectedIgnoredRows.length === selectedRows.length
  const allPageSelected = selectableRows.length > 0 && selectableRows.every((row) => selectedIds.includes(row.id))

  function toggleRow(row: ImportRow) {
    setSelectedIds((current) =>
      current.includes(row.id) ? current.filter((value) => value !== row.id) : [...current, row.id],
    )
  }

  function togglePage() {
    const pageIds = selectableRows.map((row) => row.id)
    setSelectedIds((current) =>
      allPageSelected
        ? current.filter((value) => !pageIds.includes(value))
        : Array.from(new Set([...current, ...pageIds])),
    )
  }

  async function reintegrateSelection() {
    if (!canReintegrateSelection) {
      toast.error("Sélectionnez uniquement des lignes ignorées.")
      return
    }
    try {
      await importsApi.reintegrateRows(importId, selectedIgnoredRows.map((row) => row.id))
      toast.success(`${selectedIgnoredRows.length} ligne(s) réintégrée(s).`)
      setSelectedIds([])
      await load()
    } catch (e) {
      toast.error(getApiErrorMessage(e))
    }
  }

  async function confirmBulkIgnore() {
    const motif = bulkReason.trim()
    if (!motif) {
      toast.error("Le motif global est obligatoire.")
      return
    }
    setBulkBusy(true)
    try {
      await importsApi.ignoreRows(importId, selectedRows.map((row) => row.id), motif)
      toast.success(`${selectedRows.length} ligne(s) ignorée(s).`)
      setSelectedIds([])
      setBulkReason("")
      setBulkIgnoreOpen(false)
      await load()
    } catch (e) {
      toast.error(getApiErrorMessage(e))
    } finally {
      setBulkBusy(false)
    }
  }

  function openEditor(row: ImportRow) {
    setEditing(row)
    setForm(Object.fromEntries(Object.entries(row.donnees_normalisees).map(([key, value]) => [key, value == null ? "" : String(value)])))
  }

  async function save() {
    if (!editing) return
    try {
      const corrected: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(form)) {
        const original = editing.donnees_normalisees[key]
        if (typeof original === "number") corrected[key] = value === "" ? null : Number(value)
        else if (typeof original === "boolean") corrected[key] = value === "true"
        else corrected[key] = value
      }
      await importsApi.fixRow(editing.id, corrected)
      toast.success("Ligne corrigée. Relancez ensuite la validation.")
      setEditing(null)
      await load()
    } catch (e) {
      toast.error(getApiErrorMessage(e))
    }
  }

  async function ignore(row: ImportRow) {
    const message = window.prompt("Motif de l’ignorance de cette ligne :") ?? ""
    if (!message.trim()) return
    try {
      await importsApi.ignoreRow(row.id, message)
      toast.success("Ligne ignorée.")
      await load()
    } catch (e) {
      toast.error(getApiErrorMessage(e))
    }
  }

  return (
    <>
      <PageHeader
        title="Lignes de l’import"
        description="Contrôlez les personnes détectées, corrigez uniquement les lignes en erreur et consultez les détails sans manipuler de JSON."
        backTo={`/app/imports/${importId}`}
      />

      <Card className="mb-5">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-11 pl-9"
                  placeholder="Rechercher par nom, référence, téléphone ou e-mail"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
              <select className="h-11 rounded-xl border bg-background px-3" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }}>
                <option value="">Tous les statuts</option>
                <option value="EN_ATTENTE">En attente</option>
                <option value="VALIDE">Valide</option>
                <option value="ERREUR">Erreur</option>
                <option value="IGNOREE">Ignorée</option>
                <option value="IMPORTEE">Importée</option>
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              <ImportPermissionGuard permission={P.VIEW_ERRORS}>
                <Button render={<Link to={`/app/imports/${importId}/erreurs`} />} variant="outline">
                  Voir les erreurs détaillées
                </Button>
              </ImportPermissionGuard>
              <ImportPermissionGuard permission={P.IGNORE_ROW}>
                <Button variant="outline" disabled={!canIgnoreSelection} onClick={() => setBulkIgnoreOpen(true)}>
                  <XCircle className="mr-2 size-4" />Ignorer la sélection ({selectedRows.length})
                </Button>
                <Button variant="outline" disabled={!canReintegrateSelection} onClick={() => void reintegrateSelection()}>
                  <RotateCcw className="mr-2 size-4" />Réintégrer la sélection ({selectedRows.length})
                </Button>
              </ImportPermissionGuard>
              {rows.length > 0 && (
                <ImportPermissionGuard permission={P.FIX_ROW}>
                  <Button
                    variant="outline"
                    disabled={revalidationBusy}
                    onClick={async () => {
                      if (revalidationBusy) return
                      setRevalidationBusy(true)
                      try {
                        await importsApi.validateRows(importId)
                        toast.success("Nouvelle validation lancée.")
                        const importOfficiel = await attendreFinValidation()
                        await load()
                        toast.success(
                          importOfficiel.statut === "VALIDE"
                            ? "Validation terminée."
                            : `Validation terminée avec le statut ${importOfficiel.statut}.`,
                        )
                      } catch (e) {
                        toast.error(getApiErrorMessage(e))
                      } finally {
                        setRevalidationBusy(false)
                      }
                    }}
                  >
                    <RotateCcw
                      className={`mr-2 size-4 ${revalidationBusy ? "animate-spin" : ""}`}
                    />
                    {revalidationBusy
                      ? "Validation en cours..."
                      : "Relancer la validation"}
                  </Button>
                </ImportPermissionGuard>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {error && <ErrorBox message={error} />}
      {loading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <EmptyState message="Aucune ligne à afficher." />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 px-5">
                  <input type="checkbox" aria-label="Sélectionner les lignes de cette page" checked={allPageSelected} onChange={togglePage} disabled={selectableRows.length === 0} className="size-4 accent-primary" />
                </TableHead>
                <TableHead>Ligne</TableHead>
                <TableHead>Personne</TableHead>
                <TableHead>Référence</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="px-5">
                    <input type="checkbox" aria-label={`Sélectionner la ligne ${row.numero_ligne}`} checked={selectedIds.includes(row.id)} onChange={() => toggleRow(row)} disabled={row.statut === "IMPORTEE"} className="size-4 accent-primary" />
                  </TableCell>
                  <TableCell className="font-semibold">{row.numero_ligne}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <UserRound className="size-4" />
                      </div>
                      <div>
                        <p className="font-semibold">{fullName(row)}</p>
                        <p className="text-sm text-muted-foreground">{displayValue(row.donnees_normalisees.sexe)}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{reference(row)}</p>
                    <p className="text-sm text-muted-foreground">{displayValue(row.donnees_normalisees.serie)}</p>
                  </TableCell>
                  <TableCell>
                    <p>{displayValue(row.donnees_normalisees.telephone)}</p>
                    <p className="max-w-56 truncate text-sm text-muted-foreground">{displayValue(row.donnees_normalisees.email)}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(row.statut)}>{row.statut_libelle}</Badge>
                    {row.message_statut && <p className="mt-1 max-w-56 text-xs text-muted-foreground">{row.message_statut}</p>}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => setSelected(row)}>
                        <Eye className="mr-1 size-4" />Voir
                      </Button>
                      {new Set(["ERREUR", "EN_ATTENTE"]).has(row.statut) && (
                        <ImportPermissionGuard permission={P.FIX_ROW}>
                          <Button size="sm" onClick={() => openEditor(row)}>
                            <Pencil className="mr-1 size-4" />Corriger
                          </Button>
                        </ImportPermissionGuard>
                      )}
                      {new Set(["ERREUR", "EN_ATTENTE"]).has(row.statut) && (
                        <ImportPermissionGuard permission={P.IGNORE_ROW}>
                          <Button size="sm" variant="outline" onClick={() => void ignore(row)}>
                            <XCircle className="mr-1 size-4" />Ignorer
                          </Button>
                        </ImportPermissionGuard>
                      )}
                    </div>
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
            {count.toLocaleString("fr-FR")} ligne(s) · page {page} sur {totalPages}
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

      {bulkIgnoreOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-xl">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-primary">Ignorance groupée</p>
              <h2 className="mt-1 text-2xl font-bold">Ignorer {selectedRows.length} ligne(s)</h2>
              <p className="mt-1 text-sm text-muted-foreground">Le même motif sera appliqué à toutes les lignes sélectionnées.</p>
              <div className="mt-5 rounded-xl border bg-muted/30 p-4">
                <p className="font-medium">Lignes sélectionnées</p>
                <p className="mt-1 text-sm text-muted-foreground">{selectedRows.map((row) => row.numero_ligne).join(", ")}</p>
              </div>
              <Label htmlFor="bulk-ignore-reason" className="mt-5 block">Motif global</Label>
              <textarea id="bulk-ignore-reason" className="mt-2 min-h-28 w-full resize-y rounded-xl border bg-background px-3 py-2 text-sm" value={bulkReason} onChange={(event) => setBulkReason(event.target.value)} placeholder="Ex. Déjà importées dans une liste officielle précédente." />
              <div className="mt-6 flex justify-end gap-2 border-t pt-4">
                <Button variant="outline" disabled={bulkBusy} onClick={() => setBulkIgnoreOpen(false)}>Retour</Button>
                <Button variant="destructive" disabled={bulkBusy || !bulkReason.trim()} onClick={() => void confirmBulkIgnore()}>
                  <XCircle className="mr-2 size-4" />{bulkBusy ? "Traitement..." : `Ignorer ${selectedRows.length} ligne(s)`}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="max-h-[90vh] w-full max-w-4xl overflow-auto">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-primary">Ligne {selected.numero_ligne}</p>
                  <h2 className="mt-1 text-2xl font-bold">{fullName(selected)}</h2>
                  <p className="mt-1 text-muted-foreground">{reference(selected)}</p>
                </div>
                <Badge variant={statusVariant(selected.statut)}>{selected.statut_libelle}</Badge>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <DetailSection title="Identité" fields={fieldsIn(selected.donnees_normalisees, IDENTITY_FIELDS)} data={selected.donnees_normalisees} />
                <DetailSection title="Examen ou sélection" fields={fieldsIn(selected.donnees_normalisees, EXAM_FIELDS)} data={selected.donnees_normalisees} />
                <DetailSection title="Contact" fields={fieldsIn(selected.donnees_normalisees, CONTACT_FIELDS)} data={selected.donnees_normalisees} />
                <DetailSection title="Localisation" fields={fieldsIn(selected.donnees_normalisees, LOCATION_FIELDS)} data={selected.donnees_normalisees} />
                <DetailSection title="Autres informations" fields={unknownFields(selected.donnees_normalisees)} data={selected.donnees_normalisees} />
              </div>
              {selected.message_statut && <p className="mt-4 rounded-xl bg-muted p-3 text-sm">{selected.message_statut}</p>}
              <div className="mt-6 flex justify-end">
                <Button variant="outline" onClick={() => setSelected(null)}>Fermer</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="max-h-[92vh] w-full max-w-5xl overflow-auto">
            <CardContent className="p-6">
              <div>
                <p className="text-sm font-medium text-primary">Correction de la ligne {editing.numero_ligne}</p>
                <h2 className="mt-1 text-2xl font-bold">Corriger les informations</h2>
                <p className="mt-1 text-sm text-muted-foreground">Modifiez uniquement les valeurs incorrectes. Les données seront revalidées avant la confirmation de l’import.</p>
              </div>
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                {Object.keys(editing.donnees_normalisees).map((field) => (
                  <div key={field} className="space-y-2">
                    <Label htmlFor={`field-${field}`}>{labelFor(field)}</Label>
                    <Input
                      id={`field-${field}`}
                      className="h-11"
                      value={form[field] ?? ""}
                      onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-end gap-2 border-t pt-4">
                <Button variant="outline" onClick={() => setEditing(null)}>Annuler</Button>
                <Button onClick={() => void save()}>Enregistrer la correction</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
