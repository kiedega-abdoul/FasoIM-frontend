import {
  ArrowRight,
  BadgeCheck,
  Building2,
  FileCheck2,
  UserPlus,
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
    title: "Consulter mon immersion",
    description: "Retrouvez votre affectation, votre centre d’accueil, votre date d’arrivée et les informations disponibles sur votre organisation.",
  },
  {
    icon: Building2,
    title: "Préparer mon arrivée",
    description: "Consultez les consignes, les documents utiles, les articles à apporter et les informations pratiques de votre centre.",
  },
  {
    icon: UserPlus,
    title: "Faire une demande volontaire",
    description: "Soumettez votre candidature pour participer volontairement à une session d’immersion patriotique et suivez son traitement.",
  },
  {
    icon: FileCheck2,
    title: "Attestation",
    description: "Vérifiez l’authenticité d’une attestation FasoIM ou téléchargez votre propre attestation avec votre Code FasoIM.",
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
              Votre espace public FasoIM
            </Badge>

            <div className="space-y-5">
              <h1 className="text-balance text-4xl font-bold tracking-tight drop-shadow-lg sm:text-5xl lg:text-6xl">
                Préparez et suivez votre immersion patriotique en toute simplicité
              </h1>
              <p className="max-w-2xl text-pretty text-lg leading-8 text-white/90 drop-shadow sm:text-xl">
                Consultez votre affectation, préparez votre arrivée, déposez une demande volontaire ou vérifiez une attestation FasoIM.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button render={<Link to="/consultation" />} size="lg" className="gap-2 text-base shadow-lg">
                Consulter mon immersion
                <ArrowRight className="size-4" />
              </Button>
              <Button
                render={<Link to="/demande-volontaire" />}
                size="lg"
                variant="secondary"
                className="border border-white/35 bg-white/92 text-base text-foreground shadow-lg hover:bg-white"
              >
                Faire une demande volontaire
              </Button>
              <Button
                render={<Link to="/attestation" />}
                size="lg"
                variant="outline"
                className="border-white/40 bg-transparent text-base text-white shadow-lg hover:bg-white/10 hover:text-white"
              >
                Attestation
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
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Services essentiels</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Les informations utiles pour votre immersion
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Cet espace vous permet de consulter votre situation, préparer votre arrivée, déposer une demande volontaire et vérifier une attestation FasoIM.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
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
            <h2 className="text-2xl font-bold">Retrouvez les informations qui vous concernent</h2>
            <p className="mt-2 max-w-3xl text-base text-primary-foreground/85">
              Consultez votre immersion, déposez une demande volontaire ou vérifiez une attestation officielle sans créer de compte.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              render={<Link to="/consultation" />}
              size="lg"
              variant="secondary"
              className="shrink-0 text-base"
            >
              Consulter mon immersion
            </Button>
            <Button
              render={<Link to="/demande-volontaire" />}
              size="lg"
              variant="secondary"
              className="shrink-0 text-base"
            >
              Faire une demande volontaire
            </Button>
            <Button
              render={<Link to="/attestation" />}
              size="lg"
              variant="outline"
              className="shrink-0 border-white/40 bg-transparent text-base text-white hover:bg-white/10 hover:text-white"
            >
              Attestation
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
