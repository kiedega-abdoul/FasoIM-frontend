import { useState } from "react"
import type { FormEvent } from "react"
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FilePenLine,
  LoaderCircle,
  RotateCcw,
  Search,
  SearchCheck,
  XCircle,
} from "lucide-react"
import { Link } from "react-router-dom"

import { getApiErrorMessage } from "@/api/api-error"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { volunteersApi } from "@/features/volunteers/api"
import type { VolunteerFollowUp } from "@/features/volunteers/types"

const statusLabels: Record<string, string> = {
  EN_ATTENTE: "En attente",
  EN_ETUDE: "En cours d’étude",
  CORRECTION_DEMANDEE: "Correction demandée",
  CORRIGEE: "Corrigée",
  ACCEPTEE: "Acceptée",
  REJETEE: "Rejetée",
  ANNULEE: "Annulée",
}

function getStatusMessage(result: VolunteerFollowUp) {
  switch (result.statut) {
    case "EN_ATTENTE":
      return "Votre demande a bien été reçue. Elle est en attente d’étude."

    case "EN_ETUDE":
      return "Votre demande est actuellement examinée par le service chargé des inscriptions volontaires."

    case "CORRECTION_DEMANDEE":
      return "Des informations doivent être corrigées avant la poursuite du traitement de votre demande."

    case "CORRIGEE":
      return "Vos corrections ont été enregistrées. Votre demande sera examinée de nouveau."

    case "ACCEPTEE":
      return result.code_fasoim
        ? "Votre demande a été acceptée. Votre code FasoIM est maintenant disponible."
        : "Votre demande a été acceptée. Votre inscription à la session est confirmée."

    case "REJETEE":
      return "Votre demande n’a pas été acceptée."

    case "ANNULEE":
      return "Cette demande a été annulée."

    default:
      return result.message || "Le statut de votre demande est disponible ci-dessous."
  }
}

function getStatusAppearance(statut: string) {
  switch (statut) {
    case "ACCEPTEE":
      return {
        icon: CheckCircle2,
        iconClass: "bg-primary/10 text-primary",
        badgeClass: "bg-primary/10 text-primary",
      }

    case "REJETEE":
    case "ANNULEE":
      return {
        icon: XCircle,
        iconClass: "bg-destructive/10 text-destructive",
        badgeClass: "bg-destructive/10 text-destructive",
      }

    case "CORRECTION_DEMANDEE":
      return {
        icon: FilePenLine,
        iconClass: "bg-amber-100 text-amber-700",
        badgeClass: "bg-amber-100 text-amber-700",
      }

    case "EN_ETUDE":
    case "CORRIGEE":
      return {
        icon: SearchCheck,
        iconClass: "bg-blue-100 text-blue-700",
        badgeClass: "bg-blue-100 text-blue-700",
      }

    default:
      return {
        icon: Clock3,
        iconClass: "bg-muted text-muted-foreground",
        badgeClass: "bg-muted text-muted-foreground",
      }
  }
}

export function VolunteerFollowUpPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<VolunteerFollowUp | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (loading) return

    const formData = new FormData(event.currentTarget)
    const code = String(formData.get("code_suivi") || "").trim()

    setLoading(true)
    setError("")

    try {
      const response = await volunteersApi.followApplication(code)
      setResult(response)
    } catch (exception) {
      setResult(null)
      setError(getApiErrorMessage(exception))
    } finally {
      setLoading(false)
    }
  }

  function resetSearch() {
    setResult(null)
    setError("")
  }

  const appearance = result
    ? getStatusAppearance(result.statut)
    : null

  const StatusIcon = appearance?.icon ?? AlertCircle

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <SearchCheck className="size-6" />
        </span>

        <h1 className="mt-4 text-3xl font-bold tracking-tight">
          Suivre ma demande
        </h1>

        <p className="mt-3 text-lg text-muted-foreground">
          Saisissez le code reçu après l’envoi de votre demande.
        </p>
      </div>

      <Card className="mx-auto mt-10 max-w-3xl shadow-xl shadow-primary/5">
        {!result ? (
          <>
            <CardHeader className="border-b">
              <CardTitle className="text-2xl">
                Consulter l’état de ma demande
              </CardTitle>

              <CardDescription className="text-base leading-7">
                Votre code de suivi figure dans le message affiché après
                votre inscription.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="code_suivi" className="text-base">
                    Code de suivi
                  </Label>

                  <Input
                    id="code_suivi"
                    name="code_suivi"
                    required
                    placeholder="Ex. VOL2026..."
                    autoComplete="off"
                    className="h-14 text-base"
                  />
                </div>

                {error && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-base text-destructive">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="h-14 w-full gap-2 text-base sm:w-auto sm:min-w-64"
                >
                  {loading ? (
                    <LoaderCircle className="size-5 animate-spin" />
                  ) : (
                    <Search className="size-5" />
                  )}

                  {loading
                    ? "Recherche en cours..."
                    : "Afficher ma demande"}
                </Button>
              </form>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader className="border-b">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  <span
                    className={`flex size-12 shrink-0 items-center justify-center rounded-full ${appearance?.iconClass}`}
                  >
                    <StatusIcon className="size-6" />
                  </span>

                  <div>
                    <CardDescription className="text-sm font-medium uppercase tracking-wide">
                      {result.code_suivi}
                    </CardDescription>

                    <CardTitle className="mt-1 text-2xl">
                      {result.nom_complet}
                    </CardTitle>

                    <p className="mt-2 text-base text-muted-foreground">
                      {result.session}
                    </p>
                  </div>
                </div>

                <span
                  className={`w-fit rounded-full px-4 py-2 text-sm font-semibold ${appearance?.badgeClass}`}
                >
                  {statusLabels[result.statut] ??
                    result.statut_libelle ??
                    result.statut}
                </span>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 pt-8">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border bg-muted/20 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Demande soumise le
                  </p>

                  <p className="mt-2 text-base font-semibold">
                    {new Date(result.date_soumission).toLocaleDateString(
                      "fr-FR",
                    )}
                  </p>
                </div>

                {result.date_decision && (
                  <div className="rounded-xl border bg-muted/20 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Décision prise le
                    </p>

                    <p className="mt-2 text-base font-semibold">
                      {new Date(result.date_decision).toLocaleDateString(
                        "fr-FR",
                      )}
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-xl border p-5">
                <p className="text-lg font-semibold">
                  {statusLabels[result.statut] ??
                    result.statut_libelle ??
                    "État de la demande"}
                </p>

                <p className="mt-2 text-base leading-7 text-muted-foreground">
                  {getStatusMessage(result)}
                </p>
              </div>

              {result.motif_decision && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5">
                  <p className="font-semibold">
                    Motif de la décision
                  </p>

                  <p className="mt-2 text-base leading-7 text-muted-foreground">
                    {result.motif_decision}
                  </p>
                </div>
              )}

              {result.code_fasoim && (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 text-center">
                  <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                    Votre code FasoIM
                  </p>

                  <p className="mt-3 break-all text-3xl font-bold tracking-wider text-primary">
                    {result.code_fasoim}
                  </p>

                  <p className="mt-3 text-sm text-muted-foreground">
                    Conservez ce code. Il vous permettra de consulter
                    les informations liées à votre immersion.
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetSearch}
                  className="h-12 gap-2"
                >
                  <RotateCcw className="size-4" />
                  Rechercher une autre demande
                </Button>

                <Link
                  to="/demande-volontaire"
                  className={buttonVariants({
                    variant: "outline",
                    className: "h-12 gap-2",
                  })}
                >
                  <ArrowLeft className="size-4" />
                  Retour
                </Link>
              </div>
            </CardContent>
          </>
        )}
      </Card>

      {!result && (
        <div className="mt-6 text-center">
          <Link
            to="/demande-volontaire"
            className={buttonVariants({
              variant: "outline",
              className: "gap-2",
            })}
          >
            <ArrowLeft className="size-4" />
            Retour
          </Link>
        </div>
      )}
    </section>
  )
}