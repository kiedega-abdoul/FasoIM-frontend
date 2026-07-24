import { useState } from "react"
import { BadgeCheck, Download, FileText, LoaderCircle, Search, UserRound } from "lucide-react"

import { getApiErrorMessage } from "@/api/api-error"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { publicAttestationsApi, type PublicCertificateConsultation } from "@/features/documents/public-attestations-api"

export function DownloadAttestationPage() {
  const [codeFasoim, setCodeFasoim] = useState("")
  const [result, setResult] = useState<PublicCertificateConsultation | null>(null)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState("")

  async function search(event: React.FormEvent) {
    event.preventDefault()
    const code = codeFasoim.trim()
    if (!code) {
      setError("Saisissez votre Code FasoIM.")
      return
    }
    setLoading(true)
    setError("")
    setResult(null)
    try {
      setResult(await publicAttestationsApi.consultByFasoImCode(code))
    } catch (exception) {
      setError(getApiErrorMessage(exception))
    } finally {
      setLoading(false)
    }
  }


  function unavailableMessage() {
    if (!result) return ""
    if (result.decision === "NON_ELIGIBLE") {
      return "Vous ne remplissez pas les conditions nécessaires pour obtenir une attestation."
    }
    if (result.decision === "A_VERIFIER") {
      return "Votre situation est encore en cours de vérification."
    }
    return "Votre attestation n’est pas encore disponible. Sa publication peut être en cours."
  }

  async function download() {
    if (!result?.attestation_disponible || !result.url_telechargement) return
    setDownloading(true)
    setError("")
    try {
      await publicAttestationsApi.download(
        result.url_telechargement,
        `${result.numero_document || "attestation-fasoim"}.pdf`,
      )
    } catch (exception) {
      setError(getApiErrorMessage(exception))
    } finally {
      setDownloading(false)
    }
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto mb-10 max-w-3xl text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Download className="size-8" />
        </span>
        <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">Télécharger mon attestation</h1>
        <p className="mt-4 text-lg leading-8 text-muted-foreground">
          Saisissez uniquement votre Code FasoIM. Vos informations et votre attestation publiée seront affichées.
        </p>
      </div>

      <Card className="mx-auto max-w-4xl border-border/70 shadow-xl shadow-primary/5">
        <CardHeader className="border-b px-6 py-6 sm:px-8">
          <CardTitle className="text-2xl">Code FasoIM</CardTitle>
          <CardDescription className="text-base leading-7">Utilisez le code personnel reçu dans le cadre de votre immersion.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 px-6 py-8 sm:px-8">
          <form className="space-y-5" onSubmit={search}>
            <div className="space-y-3">
              <Label htmlFor="code-fasoim" className="text-base font-semibold">Mon Code FasoIM</Label>
              <Input
                id="code-fasoim"
                value={codeFasoim}
                onChange={(event) => setCodeFasoim(event.target.value)}
                className="h-14 px-4 text-lg uppercase"
                placeholder="Ex. IP2026BAC0100001"
                autoComplete="off"
              />
            </div>
            <Button type="submit" size="lg" disabled={loading} className="h-13 gap-2 text-base sm:px-8">
              {loading ? <LoaderCircle className="size-5 animate-spin" /> : <Search className="size-5" />}
              {loading ? "Recherche…" : "Afficher mon attestation"}
            </Button>
          </form>

          {error && <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm font-medium text-destructive">{error}</div>}

          {result && <div className="space-y-5 rounded-2xl border bg-muted/20 p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><UserRound className="size-5" /></span>
                <div><p className="text-sm text-muted-foreground">Immergé</p><h2 className="text-xl font-bold">{result.immerge.nom_complet || `${result.immerge.nom} ${result.immerge.prenoms}`}</h2></div>
              </div>
              <Badge variant={result.attestation_disponible ? "default" : "secondary"}>
                {result.attestation_disponible ? "Attestation disponible" : result.decision_libelle}
              </Badge>
            </div>

            <dl className="grid gap-3 sm:grid-cols-2">
              {[
                ["Code FasoIM", result.immerge.code_fasoim],
                ["Type d’immergé", result.immerge.type_immerge],
                ["Session", `${result.session.nom} (${result.session.code})`],
                ["Région", result.affectation.region],
                ["Centre", result.affectation.centre],
                ["Décision", result.decision_libelle],
                ["Numéro de l’attestation", result.numero_document || "Non disponible"],
                ["Date de publication", result.date_publication ? new Date(result.date_publication).toLocaleDateString("fr-FR") : "Non publiée"],
              ].map(([label, value]) => <div key={label} className="rounded-xl border bg-background p-4"><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div>)}
            </dl>

            {result.attestation_disponible && result.url_telechargement ? <Button type="button" size="lg" disabled={downloading} onClick={() => void download()} className="w-full gap-2 text-base sm:w-auto">
              {downloading ? <LoaderCircle className="size-5 animate-spin" /> : <Download className="size-5" />}
              {downloading ? "Téléchargement…" : "Télécharger mon attestation"}
            </Button> : <div className="flex items-start gap-3 rounded-xl border bg-background p-4 text-sm text-muted-foreground"><FileText className="mt-0.5 size-5 shrink-0 text-primary" /><p>{unavailableMessage()}</p></div>}
          </div>}

          <div className="flex items-start gap-3 rounded-xl border bg-muted/40 p-4 text-sm leading-6 text-muted-foreground">
            <BadgeCheck className="mt-0.5 size-5 shrink-0 text-primary" />
            Le fichier téléchargé est l’attestation officielle signée et publiée par la Direction régionale.
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
