/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { useCallback, useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import {
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  RefreshCw,
  Rows3,
  Trash2,
  XCircle,
} from "lucide-react"

import { getApiErrorMessage } from "@/api/api-error"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ErrorBox, Loading, PageHeader } from "@/features/accounts/components"

import { importsApi } from "../api"
import { ImportPermissionGuard, ImportStatusBadge } from "../components"
import { formatBytes, formatDate, SOURCE_LABELS } from "../labels"
import { IMPORT_PERMISSIONS as P } from "../permissions"
import type { OfficialImport, Progress as ProgressType } from "../types"

const activeStatuses = new Set([
  "RECU",
  "LECTURE_COLONNES_EN_COURS",
  "VALIDATION_EN_COURS",
  "CONFIRMATION_EN_COURS",
])

const textareaClass =
  "min-h-28 w-full resize-y rounded-xl border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"

export function ImportDetailPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const importId = Number(id)

  const [item, setItem] = useState<OfficialImport | null>(null)
  const [progress, setProgress] = useState<ProgressType | null>(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState("")

  const [cancelOpen, setCancelOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState("")

  const load = useCallback(async () => {
    try {
      setItem(await importsApi.detail(importId))
      setError("")
    } catch (e) {
      setError(getApiErrorMessage(e))
    }
  }, [importId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!item || !activeStatuses.has(item.statut)) return

    const timer = window.setInterval(async () => {
      try {
        setProgress(await importsApi.progress(importId))
        await load()
      } catch {
        // Suivi silencieux : le prochain passage réessaiera.
      }
    }, 2500)

    return () => window.clearInterval(timer)
  }, [item?.statut, importId, load])

  async function action(
    name: string,
    fn: () => Promise<unknown>,
    message: string,
  ) {
    setBusy(name)

    try {
      await fn()
      toast.success(message)
      await load()
    } catch (e) {
      toast.error(getApiErrorMessage(e))
    } finally {
      setBusy("")
    }
  }

  async function confirmCancel() {
    const motif = cancelReason.trim()

    if (!motif) {
      toast.error("Le motif de l’annulation est obligatoire.")
      return
    }

    await action(
      "cancel",
      () => importsApi.cancel(importId, motif),
      "Import annulé.",
    )

    setCancelOpen(false)
    setCancelReason("")
  }

  async function confirmDelete() {
    setBusy("delete")

    try {
      await importsApi.remove(importId)
      toast.success("Suppression logique lancée.")
      setDeleteOpen(false)
      nav("/app/imports")
    } catch (e) {
      toast.error(getApiErrorMessage(e))
    } finally {
      setBusy("")
    }
  }

  async function confirmImport() {
    setBusy("confirm")

    try {
      await importsApi.confirm(importId)

      setItem((current) =>
        current
          ? {
              ...current,
              statut: "CONFIRMATION_EN_COURS",
              statut_libelle: "Confirmation en cours",
            }
          : current,
      )

      setProgress({
        import_id: importId,
        operation: "confirmation_import",
        pourcentage: 0,
        message: "Confirmation en attente de traitement...",
        updated_at: new Date().toISOString(),
      })

      toast.success("Confirmation de l’import lancée.")
    } catch (e) {
      toast.error(getApiErrorMessage(e))
    } finally {
      setBusy("")
    }
  }

  if (error) return <ErrorBox message={error} />
  if (!item) return <Loading />

  const canMap =
    item.statut === "CORRESPONDANCE_REQUISE" ||
    item.statut === "CORRESPONDANCE_VALIDEE" ||
    item.statut === "VALIDE_AVEC_ERREURS"

  const canValidate =
    item.statut === "CORRESPONDANCE_VALIDEE" ||
    item.statut === "VALIDE_AVEC_ERREURS" ||
    item.statut === "ECHEC"

  const canConfirm =
    item.statut === "VALIDE" || item.statut === "VALIDE_AVEC_ERREURS"

  const canCancel = !new Set([
    "TERMINE",
    "ANNULE",
    "CONFIRMATION_EN_COURS",
  ]).has(item.statut)

  const canDelete = !new Set([
    "TERMINE",
    "CONFIRMATION_EN_COURS",
  ]).has(item.statut)

  const isCancelled = item.statut === "ANNULE"
  const isFinished = item.statut === "TERMINE"
  const importRate =
    item.total_lignes > 0
      ? ((item.lignes_importees / item.total_lignes) * 100).toLocaleString(
          "fr-FR",
          {
            minimumFractionDigits: 0,
            maximumFractionDigits: 1,
          },
        )
      : "0"

  const statistics = isFinished
    ? [
        { label: "Total", value: item.total_lignes, Icon: Rows3 },
        {
          label: "Importées",
          value: item.lignes_importees,
          Icon: FileSpreadsheet,
        },
        { label: "Erreurs", value: item.lignes_erreur, Icon: AlertTriangle },
        { label: "Ignorées", value: item.lignes_ignorees, Icon: XCircle },
        { label: "Taux importé", value: `${importRate} %`, Icon: CheckCircle2 },
      ]
    : [
        { label: "Total", value: item.total_lignes, Icon: Rows3 },
        { label: "Valides", value: item.lignes_valides, Icon: CheckCircle2 },
        { label: "Erreurs", value: item.lignes_erreur, Icon: AlertTriangle },
        { label: "Ignorées", value: item.lignes_ignorees, Icon: XCircle },
        {
          label: "Importées",
          value: item.lignes_importees,
          Icon: FileSpreadsheet,
        },
      ]

  return (
    <>
      <PageHeader
        title={item.nom_fichier_original}
        description={`${SOURCE_LABELS[item.type_source]} · ${item.session_libelle}`}
        backTo="/app/imports"
      />

      <div className="mb-5 flex flex-wrap gap-2">
        <ImportStatusBadge status={item.statut} />
        <span className="rounded-full border px-3 py-1 text-sm">
          {formatBytes(item.taille_fichier)}
        </span>
        <span className="rounded-full border px-3 py-1 text-sm">
          Importé le {formatDate(item.date_import)}
        </span>
      </div>

      {item.message_erreur && (
        <div
          className={
            isCancelled
              ? "mb-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900"
              : "mb-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-destructive"
          }
        >
          <strong>{isCancelled ? "Import annulé :" : "Échec du traitement :"}</strong>{" "}
          {item.message_erreur}
        </div>
      )}

      {progress && activeStatuses.has(item.statut) && (
        <Card className="mb-5 overflow-hidden border-primary/20">
          <CardContent className="p-5">
            <div className="mb-3 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold">
                  {progress.operation || "Traitement en cours"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {progress.message || "Veuillez patienter."}
                </p>
              </div>

              <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                {progress.pourcentage} %
              </span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{
                  width: `${Math.max(
                    0,
                    Math.min(100, progress.pourcentage),
                  )}%`,
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {statistics.map(({ label, value, Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 p-4">
              <Icon className="size-6 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-2xl font-bold">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-5">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold">Étape actuelle et actions</h2>

          <div className="mt-4 flex flex-wrap gap-3">
            {canMap && (
              <ImportPermissionGuard permission={P.VALIDATE_MAPPING}>
                <Button
                  render={
                    <Link
                      to={`/app/imports/${item.id}/correspondance`}
                    />
                  }
                >
                  Configurer la correspondance
                </Button>
              </ImportPermissionGuard>
            )}

            <ImportPermissionGuard permission={P.VIEW_ROWS}>
              <Button
                render={<Link to={`/app/imports/${item.id}/lignes`} />}
                variant="outline"
              >
                Voir les lignes
              </Button>
            </ImportPermissionGuard>

            <ImportPermissionGuard permission={P.VIEW_ERRORS}>
              <Button
                render={<Link to={`/app/imports/${item.id}/erreurs`} />}
                variant="outline"
              >
                Voir les erreurs
              </Button>
            </ImportPermissionGuard>

            {canValidate && (
              <ImportPermissionGuard permission={P.VALIDATE_ROWS}>
                <Button
                  disabled={!!busy}
                  onClick={() =>
                    void action(
                      "validate",
                      () => importsApi.validateRows(item.id),
                      "Validation des lignes lancée.",
                    )
                  }
                >
                  Valider les lignes
                </Button>
              </ImportPermissionGuard>
            )}

            {item.statut === "ECHEC" && (
              <ImportPermissionGuard permission={P.RETRY_READ}>
                <Button
                  variant="outline"
                  disabled={!!busy}
                  onClick={() =>
                    void action(
                      "retry",
                      () => importsApi.retryRead(item.id),
                      "Lecture relancée.",
                    )
                  }
                >
                  <RefreshCw className="mr-2 size-4" />
                  Relancer la lecture
                </Button>
              </ImportPermissionGuard>
            )}

            {canConfirm && (
              <ImportPermissionGuard permission={P.CONFIRM}>
                <Button
                  disabled={!!busy || item.lignes_erreur > 0}
                  onClick={() => void confirmImport()}
                >
                  Confirmer l’import
                </Button>
              </ImportPermissionGuard>
            )}

            {canCancel && (
              <ImportPermissionGuard permission={P.CANCEL}>
                <Button
                  variant="outline"
                  disabled={!!busy}
                  onClick={() => setCancelOpen(true)}
                >
                  Annuler
                </Button>
              </ImportPermissionGuard>
            )}

            {canDelete && (
              <ImportPermissionGuard permission={P.DELETE}>
                <Button
                  variant="destructive"
                  disabled={!!busy}
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="mr-2 size-4" />
                  Supprimer
                </Button>
              </ImportPermissionGuard>
            )}
          </div>

          {item.statut === "VALIDE_AVEC_ERREURS" &&
            item.lignes_erreur > 0 && (
              <p className="mt-3 text-sm text-amber-700">
                Corrigez ou ignorez toutes les lignes en erreur, puis relancez
                la validation avant de confirmer.
              </p>
            )}
        </CardContent>
      </Card>

      <Card className="mt-5">
        <CardContent className="grid gap-5 p-6 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Importateur</p>
            <p className="font-medium">{item.importe_par_nom || "—"}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Commentaire</p>
            <p className="font-medium">
              {item.commentaire || "Aucun commentaire"}
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">
              Colonnes détectées
            </p>

            {item.colonnes_detectees?.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {item.colonnes_detectees.map((colonne, index) => (
                  <span
                    key={`${colonne}-${index}`}
                    className="rounded-full border bg-muted px-3 py-1 text-sm font-medium"
                  >
                    {colonne}
                  </span>
                ))}
              </div>
            ) : (
              <p className="font-medium">En attente de lecture</p>
            )}
          </div>

          <div>
            <p className="text-sm text-muted-foreground">
              Dernière validation
            </p>
            <p className="font-medium">
              {formatDate(item.date_validation)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Annuler cet import</DialogTitle>
            <DialogDescription>
              L’import ne pourra plus être poursuivi. Son historique restera
              disponible pour la traçabilité.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label
              htmlFor="cancel-reason"
              className="text-sm font-medium"
            >
              Motif de l’annulation
            </label>

            <textarea
              id="cancel-reason"
              className={textareaClass}
              rows={5}
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              placeholder="Ex. Fichier remplacé par une liste officielle corrigée."
            />

            <p className="text-xs text-muted-foreground">
              Le motif est obligatoire et sera conservé dans l’historique.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              disabled={busy === "cancel"}
              onClick={() => setCancelOpen(false)}
            >
              Retour
            </Button>

            <Button
              variant="destructive"
              disabled={!cancelReason.trim() || busy === "cancel"}
              onClick={() => void confirmCancel()}
            >
              {busy === "cancel"
                ? "Annulation..."
                : "Confirmer l’annulation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Supprimer cet import</DialogTitle>
            <DialogDescription>
              Cette action supprimera logiquement l’import et ses données
              préparatoires. Elle reste interdite si des immergés ont déjà été
              créés.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border border-destructive/25 bg-destructive/5 p-4">
            <p className="font-medium text-destructive">
              {item.nom_fichier_original}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {SOURCE_LABELS[item.type_source]} · {item.session_libelle}
            </p>
            <p className="mt-3 text-sm">
              L’annulation conserve l’import visible. La suppression le retire
              des listes courantes.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              disabled={busy === "delete"}
              onClick={() => setDeleteOpen(false)}
            >
              Retour
            </Button>

            <Button
              variant="destructive"
              disabled={busy === "delete"}
              onClick={() => void confirmDelete()}
            >
              <Trash2 className="mr-2 size-4" />
              {busy === "delete"
                ? "Suppression..."
                : "Confirmer la suppression"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
