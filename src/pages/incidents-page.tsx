import { Siren } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"

export function IncidentsPage() {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Suivi transversal</p>
        <h1 className="mt-1 text-2xl font-bold">Incidents</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Signalez et suivez les incidents relevant de votre affectation active.
        </p>
      </div>
      <Card>
        <CardContent className="flex min-h-56 flex-col items-center justify-center p-8 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Siren className="size-7" />
          </span>
          <h2 className="mt-4 text-lg font-semibold">Gestion des incidents</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Le signalement et le suivi des incidents ne sont pas encore disponibles dans votre espace. Pour une
            situation urgente, adressez-vous à votre responsable.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
