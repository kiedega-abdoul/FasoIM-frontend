import { ArrowLeft } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"

export function NotFoundPage() {
  return (
    <section className="mx-auto flex min-h-[65vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">Adresse indisponible</p>
      <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">Contenu introuvable</h1>
      <p className="mt-4 text-muted-foreground">
        L’adresse demandée n’existe pas ou n’est plus disponible.
      </p>
      <Button render={<Link to="/" />} className="mt-8 gap-2">
        <ArrowLeft className="size-4" />
        Retour à l’accueil
      </Button>
    </section>
  )
}
