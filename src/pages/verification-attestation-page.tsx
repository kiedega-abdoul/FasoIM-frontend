import { QrCode, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function VerificationAttestationPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <span className="mx-auto flex size-13 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <QrCode className="size-6" />
        </span>
        <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">Vérifier une attestation</h1>
        <p className="mt-3 text-muted-foreground">
          Contrôlez l’authenticité d’une attestation publiée par FasoIM.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Code de vérification</CardTitle>
          <CardDescription>Saisissez le code présent sur le document ou issu du QR code.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={(event) => event.preventDefault()}>
            <div className="space-y-2">
              <Label htmlFor="verification-code">Code de l’attestation</Label>
              <Input id="verification-code" placeholder="Ex. ATT-2026-XXXXXXXX" autoComplete="off" />
            </div>
            <Button type="submit" className="w-full gap-2 sm:w-auto">
              <Search className="size-4" />
              Vérifier
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  )
}
