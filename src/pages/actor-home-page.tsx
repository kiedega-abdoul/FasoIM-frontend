import {
  Activity,
  ArrowRight,
  Building2,
  FileCheck2,
  Users,
} from "lucide-react"
import { Link } from "react-router-dom"

import { HeroSlideshow } from "@/components/common/hero-slideshow"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const capabilities = [
  {
    icon: Users,
    title: "Gérer les immergés",
    description: "Consultez les dossiers, suivez les affectations et accompagnez les participants tout au long de leur immersion.",
  },
  {
    icon: Building2,
    title: "Organiser les centres",
    description: "Gérez les capacités, les sections, les groupes, les dortoirs, les lits et les équipes des centres.",
  },
  {
    icon: Activity,
    title: "Suivre les activités",
    description: "Enregistrez les présences, les activités, les repas, les kits, les incidents et les visites médicales.",
  },
  {
    icon: FileCheck2,
    title: "Gérer les documents",
    description: "Préparez les rapports, publiez les résultats, générez les attestations et vérifiez les documents officiels.",
  },
]

export function ActorHomePage() {
  return (
    <>
      <section className="relative isolate min-h-[680px] overflow-hidden border-b text-white">
        <HeroSlideshow />

        <div className="relative z-10 mx-auto flex min-h-[680px] max-w-7xl items-center px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="max-w-3xl space-y-8">
            <Badge className="border-white/25 bg-white/15 text-white backdrop-blur-sm hover:bg-white/20">
              Espace de travail FasoIM
            </Badge>

            <div className="space-y-5">
              <h1 className="text-balance text-4xl font-bold tracking-tight drop-shadow-lg sm:text-5xl lg:text-6xl">
                Gérez efficacement les activités de l’immersion patriotique
              </h1>
              <p className="max-w-2xl text-pretty text-lg leading-8 text-white/90 drop-shadow sm:text-xl">
                Retrouvez les sessions, les centres, les affectations, les participants, les activités, les documents et les attestations depuis un espace unique.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                render={<Link to="/espace-acteur/connexion" />}
                size="lg"
                className="gap-2 text-base shadow-lg"
              >
                Accéder à la plateforme
                <ArrowRight className="size-4" />
              </Button>
              <Button
                render={<Link to="/espace-acteur/verification-attestation" />}
                size="lg"
                variant="secondary"
                className="border border-white/35 bg-white/92 text-base text-foreground shadow-lg hover:bg-white"
              >
                Vérifier une attestation
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-18 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            Outils de gestion
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Tout ce qu’il faut pour organiser et suivre les sessions
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Accédez rapidement aux opérations nécessaires à votre travail quotidien sur FasoIM.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {capabilities.map(({ icon: Icon, title, description }) => (
            <Card key={title} className="group border-border/70 transition-all hover:-translate-y-1 hover:border-primary/25 hover:shadow-lg">
              <CardContent className="p-7">
                <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-6" />
                </span>
                <h3 className="mt-5 text-xl font-semibold">{title}</h3>
                <p className="mt-2 text-base leading-7 text-muted-foreground">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </>
  )
}
