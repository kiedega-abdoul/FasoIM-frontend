import { ArrowRight, BadgeCheck, Download, FileCheck2 } from "lucide-react"
import { Link } from "react-router-dom"

import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export function AttestationChoicePage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <FileCheck2 className="size-8" />
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Attestation</h1>
        <p className="mx-auto mt-3 max-w-2xl text-lg text-muted-foreground">
          Choisissez l’action que vous souhaitez effectuer.
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-5xl gap-7 md:grid-cols-2">
        <Card className="shadow-lg shadow-primary/5">
          <CardContent className="flex h-full flex-col p-8 sm:p-10">
            <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BadgeCheck className="size-6" />
            </span>
            <h2 className="mt-6 text-2xl font-semibold">Vérifier une attestation</h2>
            <p className="mt-3 flex-1 text-base leading-7 text-muted-foreground">
              Contrôlez l’authenticité d’une attestation à partir de son code de vérification ou de son QR code.
            </p>
            <Link to="/attestation/verifier" className={buttonVariants({ className: "mt-7 h-12 gap-2 text-base" })}>
              Vérifier une attestation <ArrowRight className="size-4" />
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-lg shadow-primary/5">
          <CardContent className="flex h-full flex-col p-8 sm:p-10">
            <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Download className="size-6" />
            </span>
            <h2 className="mt-6 text-2xl font-semibold">Télécharger mon attestation</h2>
            <p className="mt-3 flex-1 text-base leading-7 text-muted-foreground">
              Saisissez uniquement votre Code FasoIM pour consulter vos informations et télécharger votre attestation publiée.
            </p>
            <Link to="/attestation/telecharger" className={buttonVariants({ className: "mt-7 h-12 gap-2 text-base" })}>
              Télécharger mon attestation <ArrowRight className="size-4" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
