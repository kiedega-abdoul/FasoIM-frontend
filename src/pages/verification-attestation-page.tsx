import { useState } from "react"
import { BadgeCheck, LoaderCircle, QrCode, Search, ShieldCheck } from "lucide-react"

import { getApiErrorMessage } from "@/api/api-error"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { publicAttestationsApi, type PublicCertificateVerification } from "@/features/documents/public-attestations-api"

export function VerificationAttestationPage() {
  const [code, setCode] = useState("")
  const [result, setResult] = useState<PublicCertificateVerification | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function verify(event: React.FormEvent) {
    event.preventDefault()
    const value = code.trim()
    if (!value) {
      setError("Saisissez le code de vérification de l’attestation.")
      return
    }
    setLoading(true)
    setError("")
    setResult(null)
    try {
      setResult(await publicAttestationsApi.verify(value))
    } catch (exception) {
      setError(getApiErrorMessage(exception))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto mb-10 max-w-3xl text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <QrCode className="size-8" />
        </span>
        <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">Vérifier une attestation</h1>
        <p className="mt-4 text-lg leading-8 text-muted-foreground sm:text-xl">
          Contrôlez facilement l’authenticité d’une attestation publiée par FasoIM.
        </p>
      </div>

      <Card className="mx-auto max-w-4xl border-border/70 shadow-xl shadow-primary/5">
        <CardHeader className="border-b px-6 py-6 sm:px-8">
          <CardTitle className="text-2xl">Code de vérification</CardTitle>
          <CardDescription className="text-base leading-7">
            Saisissez le code présent sur l’attestation ou obtenu à partir de son QR code.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 px-6 py-8 sm:px-8">
          <form className="space-y-6" onSubmit={verify}>
            <div className="space-y-3">
              <Label htmlFor="verification-code" className="text-base font-semibold">Code de l’attestation</Label>
              <Input
                id="verification-code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                className="h-14 px-4 text-lg uppercase"
                placeholder="Ex. ATT-2026-XXXXXXXX"
                autoComplete="off"
              />
            </div>

            <Button type="submit" size="lg" disabled={loading} className="h-13 w-full gap-2 text-base sm:w-auto sm:px-8">
              {loading ? <LoaderCircle className="size-5 animate-spin" /> : <Search className="size-5" />}
              {loading ? "Vérification…" : "Vérifier l’attestation"}
            </Button>
          </form>

          {error && <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm font-medium text-destructive">{error}</div>}

          {result && <div className="space-y-4 rounded-2xl border bg-primary/5 p-5">
            <div className="flex items-center gap-3">
              <BadgeCheck className="size-7 text-primary" />
              <div><p className="font-bold">Attestation authentique</p><p className="text-sm text-muted-foreground">Le document a bien été publié par FasoIM.</p></div>
              <Badge className="ml-auto">Valide</Badge>
            </div>
            <dl className="grid gap-3 sm:grid-cols-2">
              {[
                ["Numéro", result.numero_document || "—"],
                ["Code de vérification", code],
                ["Immergé", result.nom_complet || "—"],
                ["Code FasoIM", result.code_fasoim || "—"],
                ["Session", result.session || "—"],
                ["Date de délivrance", result.date_delivrance ? new Date(result.date_delivrance).toLocaleDateString("fr-FR") : "—"],
                ["Signataire", result.signataire || "—"],
                ["Fonction du signataire", result.fonction_signataire || "—"],
              ].map(([label, value]) => <div key={label} className="rounded-xl border bg-background p-4"><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div>)}
            </dl>
          </div>}

          <div className="rounded-xl border bg-muted/40 p-4">
            <p className="flex items-start gap-3 text-sm leading-6 text-muted-foreground sm:text-base">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
              La vérification permet de confirmer qu’une attestation a bien été publiée par FasoIM.
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
