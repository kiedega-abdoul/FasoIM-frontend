import {
  ArrowRight,
  BadgeCheck,
  Building2,
  FileCheck2,
  Users,
} from "lucide-react"
import { Link } from "react-router-dom"

import { HeroSlideshow } from "@/components/common/hero-slideshow"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const services = [
  {
    icon: Users,
    title: "Suivi des immergés",
    description: "Centralisation des informations, affectations et parcours au sein des centres.",
  },
  {
    icon: Building2,
    title: "Gestion des centres",
    description: "Organisation des capacités, sections, groupes, dortoirs et lits.",
  },
  {
    icon: FileCheck2,
    title: "Documents officiels",
    description: "Génération, publication et vérification sécurisée des attestations.",
  },
]

const guarantees = [
  "Informations utiles avant l’arrivée",
  "Consultation simple et sécurisée",
  "Attestations officiellement vérifiables",
]

export function HomePage() {
  return (
    <>
      <section className="relative isolate min-h-[680px] overflow-hidden border-b text-white">
        <HeroSlideshow />

        <div className="relative z-10 mx-auto flex min-h-[680px] max-w-7xl items-center px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="max-w-3xl space-y-8">
            <Badge className="border-white/25 bg-white/15 text-white backdrop-blur-sm hover:bg-white/20">
              Plateforme nationale d’immersion patriotique
            </Badge>

            <div className="space-y-5">
              <h1 className="text-balance text-4xl font-bold tracking-tight drop-shadow-lg sm:text-5xl lg:text-6xl">
                Préparez et suivez votre immersion patriotique en toute simplicité
              </h1>
              <p className="max-w-2xl text-pretty text-lg leading-8 text-white/90 drop-shadow sm:text-xl">
                Consultez votre affectation, les informations de votre centre, les consignes utiles et votre attestation lorsqu’elle est disponible.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button render={<Link to="/consultation" />} size="lg" className="gap-2 text-base shadow-lg">
                Consulter mes informations
                <ArrowRight className="size-4" />
              </Button>
              <Button
                render={<Link to="/verification-attestation" />}
                size="lg"
                variant="secondary"
                className="border border-white/35 bg-white/92 text-base text-foreground shadow-lg hover:bg-white"
              >
                Vérifier une attestation
              </Button>
            </div>

            <div className="grid gap-3 pt-2 sm:grid-cols-3">
              {guarantees.map((item) => (
                <div key={item} className="flex items-center gap-2 text-base text-white/90">
                  <BadgeCheck className="size-4 shrink-0 text-yellow-300" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-18 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Services essentiels</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Un parcours suivi de bout en bout
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            Chaque acteur accède aux fonctionnalités correspondant à son rôle et à son périmètre.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {services.map(({ icon: Icon, title, description }) => (
            <Card key={title} className="group border-border/70 transition-all hover:-translate-y-1 hover:border-primary/25 hover:shadow-lg">
              <CardContent className="p-6">
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-5 text-xl font-semibold">{title}</h3>
                <p className="mt-2 text-base leading-7 text-muted-foreground">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 py-12 sm:px-6 md:flex-row md:items-center lg:px-8">
          <div>
            <h2 className="text-2xl font-bold">Vous êtes un acteur interne de FasoIM ?</h2>
            <p className="mt-2 text-base text-primary-foreground/85">
              Accédez à votre espace sécurisé selon vos permissions et votre affectation active.
            </p>
          </div>
          <Button
            render={<Link to="/connexion" />}
            size="lg"
            variant="secondary"
            className="shrink-0 text-base"
          >
            Accéder à la plateforme
          </Button>
        </div>
      </section>
    </>
  )
}
