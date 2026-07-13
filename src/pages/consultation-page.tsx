import { Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ConsultationPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Espace public</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Consulter mes informations</h1>
        <p className="mt-3 text-muted-foreground">
          Retrouvez vos informations d’arrivée et d’affectation à partir de votre identifiant officiel.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recherche d’un immergé</CardTitle>
          <CardDescription>Le service sera connecté au backend lors de l’étape API.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={(event) => event.preventDefault()}>
            <div className="space-y-2">
              <Label htmlFor="identifiant">Code FasoIM, numéro PV ou récépissé</Label>
              <Input id="identifiant" placeholder="Ex. IP2026BAC0100001" autoComplete="off" />
            </div>
            <Button type="submit" className="w-full gap-2 sm:w-auto">
              <Search className="size-4" />
              Rechercher
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  )
}
