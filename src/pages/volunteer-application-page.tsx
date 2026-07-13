import { ArrowRight, CheckCircle2, UserPlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const selectClassName =
  "h-12 w-full rounded-xl border border-input bg-background px-3 text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"

export function VolunteerApplicationPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <UserPlus className="size-7" />
        </span>
        <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
          Demande de participation volontaire
        </h1>
        <p className="mt-4 text-lg leading-8 text-muted-foreground">
          Remplissez les informations demandées pour soumettre votre candidature à une session d’immersion patriotique ouverte aux volontaires.
        </p>
      </div>

      <Card className="mx-auto mt-10 max-w-5xl shadow-xl shadow-primary/5">
        <CardHeader className="border-b">
          <CardTitle className="text-2xl">Informations du volontaire</CardTitle>
          <CardDescription className="text-base">
            Les champs marqués d’un astérisque sont obligatoires.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-8">
          <form className="grid gap-6 sm:grid-cols-2" onSubmit={(event) => event.preventDefault()}>
            <div className="space-y-2">
              <Label htmlFor="nom" className="text-base">
                Nom <span className="text-destructive">*</span>
              </Label>
              <Input id="nom" name="nom" required className="h-12 text-base" placeholder="Votre nom" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prenoms" className="text-base">Prénom(s)</Label>
              <Input id="prenoms" name="prenoms" className="h-12 text-base" placeholder="Vos prénoms" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sexe" className="text-base">Sexe</Label>
              <select id="sexe" name="sexe" className={selectClassName} defaultValue="">
                <option value="">Non précisé</option>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
                <option value="AUTRE">Autre</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_naissance" className="text-base">Date de naissance</Label>
              <Input id="date_naissance" name="date_naissance" type="date" className="h-12 text-base" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lieu_naissance" className="text-base">Lieu de naissance</Label>
              <Input id="lieu_naissance" name="lieu_naissance" className="h-12 text-base" placeholder="Ville ou localité" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nationalite" className="text-base">Nationalité</Label>
              <Input id="nationalite" name="nationalite" className="h-12 text-base" placeholder="Votre nationalité" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numero_cnib" className="text-base">Numéro CNIB</Label>
              <Input id="numero_cnib" name="numero_cnib" className="h-12 text-base" placeholder="Numéro de la CNIB" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telephone" className="text-base">
                Téléphone <span className="text-destructive">*</span>
              </Label>
              <Input
                id="telephone"
                name="telephone"
                type="tel"
                required
                className="h-12 text-base"
                placeholder="+226 XX XX XX XX"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-base">Adresse e-mail</Label>
              <Input id="email" name="email" type="email" className="h-12 text-base" placeholder="nom@exemple.com" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nom_contact_urgence" className="text-base">Nom du contact d’urgence</Label>
              <Input
                id="nom_contact_urgence"
                name="nom_contact_urgence"
                className="h-12 text-base"
                placeholder="Nom et prénom(s)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_urgence" className="text-base">Téléphone du contact d’urgence</Label>
              <Input
                id="contact_urgence"
                name="contact_urgence"
                type="tel"
                className="h-12 text-base"
                placeholder="+226 XX XX XX XX"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="region_residence" className="text-base">Région de résidence</Label>
              <Input id="region_residence" name="region_residence" className="h-12 text-base" placeholder="Votre région" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="province_residence" className="text-base">Province de résidence</Label>
              <Input id="province_residence" name="province_residence" className="h-12 text-base" placeholder="Votre province" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="commune_residence" className="text-base">Commune de résidence</Label>
              <Input id="commune_residence" name="commune_residence" className="h-12 text-base" placeholder="Votre commune" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adresse_residence" className="text-base">Adresse de résidence</Label>
              <Input id="adresse_residence" name="adresse_residence" className="h-12 text-base" placeholder="Secteur, quartier ou village" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="niveau_etude" className="text-base">Niveau d’étude</Label>
              <Input id="niveau_etude" name="niveau_etude" className="h-12 text-base" placeholder="Votre niveau d’étude" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profession" className="text-base">Profession</Label>
              <Input id="profession" name="profession" className="h-12 text-base" placeholder="Votre profession" />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="motivation" className="text-base">Motivation</Label>
              <textarea
                id="motivation"
                name="motivation"
                rows={5}
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Expliquez brièvement pourquoi vous souhaitez participer."
              />
            </div>

            <div className="rounded-xl border bg-muted/40 p-4 sm:col-span-2">
              <p className="flex items-start gap-3 text-sm leading-6 text-muted-foreground">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
                Après l’envoi, un code de suivi vous permettra de consulter le traitement de votre demande.
              </p>
            </div>

            <div className="sm:col-span-2">
              <Button type="submit" size="lg" className="w-full gap-2 text-base">
                Soumettre ma demande
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  )
}
