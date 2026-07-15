import { ArrowRight, SearchCheck, FilePlus2, UserPlus } from "lucide-react"
import { Link } from "react-router-dom"

import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export function VolunteerChoicePage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <UserPlus className="size-6" />
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">Demande volontaire</h1>
        <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
          Choisissez l’action que vous souhaitez effectuer.
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-5xl gap-7 md:grid-cols-2">
        <Card className="shadow-lg shadow-primary/5">
          <CardContent className="flex h-full flex-col p-8 sm:p-10">
            <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <SearchCheck className="size-6" />
            </span>
            <h2 className="mt-6 text-2xl font-semibold">Consulter ma demande d’immersion</h2>
            <p className="mt-3 flex-1 text-base leading-7 text-muted-foreground">
              Consultez l’état de votre demande avec le code reçu après votre inscription.
            </p>
            <Link to="/demande-volontaire/suivi" className={buttonVariants({ className: "mt-7 h-12 gap-2 text-base" })}>
              Suivre ma demande <ArrowRight className="size-4" />
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-lg shadow-primary/5">
          <CardContent className="flex h-full flex-col p-8 sm:p-10">
            <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FilePlus2 className="size-6" />
            </span>
            <h2 className="mt-6 text-2xl font-semibold">Effectuer une demande d’immersion</h2>
            <p className="mt-3 flex-1 text-base leading-7 text-muted-foreground">
              Inscrivez-vous à une session d’immersion volontaire actuellement ouverte.
            </p>
            <Link to="/demande-volontaire/nouvelle" className={buttonVariants({ className: "mt-7 h-12 gap-2 text-base" })}>
              Faire une demande <ArrowRight className="size-4" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
