import { Search, UserRoundSearch } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ConsultationPage() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto mb-10 max-w-3xl text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <UserRoundSearch className="size-8" />
        </span>
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Espace public
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          Consulter mes informations
        </h1>
        <p className="mt-4 text-lg leading-8 text-muted-foreground sm:text-xl">
          Retrouvez vos informations d’arrivée, votre affectation et les indications utiles liées à votre immersion.
        </p>
      </div>

      <Card className="mx-auto max-w-4xl border-border/70 shadow-xl shadow-primary/5">
        <CardHeader className="border-b px-6 py-6 sm:px-8">
          <CardTitle className="text-2xl">Rechercher mon dossier</CardTitle>
          <CardDescription className="text-base leading-7">
            Saisissez l’identifiant qui vous a été communiqué.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 py-8 sm:px-8">
          <form className="space-y-6" onSubmit={(event) => event.preventDefault()}>
            <div className="space-y-3">
              <Label htmlFor="identifiant" className="text-base font-semibold">
                Code FasoIM, numéro PV ou récépissé
              </Label>
              <Input
                id="identifiant"
                name="identifiant"
                className="h-14 px-4 text-lg"
                placeholder="Ex. IP2026BAC0100001"
                autoComplete="off"
              />
            </div>

            <Button type="submit" size="lg" className="h-13 w-full gap-2 text-base sm:w-auto sm:px-8">
              <Search className="size-5" />
              Rechercher mon dossier
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  )
}
