import { QrCode, Search, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function VerificationAttestationPage() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto mb-10 max-w-3xl text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <QrCode className="size-8" />
        </span>
        <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
          Vérifier une attestation
        </h1>
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

        <CardContent className="px-6 py-8 sm:px-8">
          <form className="space-y-6" onSubmit={(event) => event.preventDefault()}>
            <div className="space-y-3">
              <Label htmlFor="verification-code" className="text-base font-semibold">
                Code de l’attestation
              </Label>
              <Input
                id="verification-code"
                name="verification-code"
                className="h-14 px-4 text-lg"
                placeholder="Ex. ATT-2026-XXXXXXXX"
                autoComplete="off"
              />
            </div>

            <Button type="submit" size="lg" className="h-13 w-full gap-2 text-base sm:w-auto sm:px-8">
              <Search className="size-5" />
              Vérifier l’attestation
            </Button>

            <div className="rounded-xl border bg-muted/40 p-4">
              <p className="flex items-start gap-3 text-sm leading-6 text-muted-foreground sm:text-base">
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
                La vérification permet de confirmer qu’une attestation a bien été publiée par FasoIM.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  )
}
