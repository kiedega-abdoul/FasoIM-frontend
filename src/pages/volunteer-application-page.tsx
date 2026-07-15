import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { ArrowLeft, ArrowRight, CheckCircle2, FileText, LoaderCircle, UserPlus } from "lucide-react"
import { Link } from "react-router-dom"

import { getApiErrorMessage } from "@/api/api-error"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { sessionsApi } from "@/features/sessions/api"
import { formatDate } from "@/features/sessions/labels"
import type { PublicSession } from "@/features/sessions/types"
import { volunteersApi } from "@/features/volunteers/api"
import type { VolunteerApplicationCreated, VolunteerApplicationPayload } from "@/features/volunteers/types"

const selectClassName = "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
const fieldClassName = "h-10 text-sm"

export function VolunteerApplicationPage() {
  const [session, setSession] = useState<PublicSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [created, setCreated] = useState<VolunteerApplicationCreated | null>(null)

  useEffect(() => {
    sessionsApi.publicOpenSessions()
      .then((rows) => setSession(rows[0] ?? null))
      .catch((exception) => setError(getApiErrorMessage(exception)))
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session || submitting) return

    setError("")
    setSubmitting(true)

    const form = event.currentTarget
    const formData = new FormData(form)
    const payload = Object.fromEntries(formData.entries()) as Record<string, string>

    try {
      const response = await volunteersApi.submitApplication({
        ...payload,
        session_id: session.id,
      } as VolunteerApplicationPayload)
      setCreated(response)
      form.reset()
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch (exception) {
      setError(getApiErrorMessage(exception))
    } finally {
      setSubmitting(false)
    }
  }

  return <section className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-4xl text-center">
      <span className="mx-auto flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><UserPlus className="size-5" /></span>
      <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Demande de participation volontaire</h1>
      <p className="mt-2 text-sm text-muted-foreground">Consultez la session ouverte puis renseignez votre demande.</p>
    </div>

    {error && <div className="mx-auto mt-5 max-w-6xl rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}

    {created ? <Card className="mx-auto mt-8 max-w-3xl border-primary/30 shadow-xl shadow-primary/5">
      <CardContent className="py-10 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary"><CheckCircle2 className="size-7" /></div>
        <h2 className="mt-5 text-2xl font-semibold">Demande enregistrée</h2>
        <p className="mt-2 text-sm text-muted-foreground">Conservez soigneusement ce code. Il servira à suivre votre demande.</p>
        <div className="mx-auto mt-5 max-w-md rounded-xl border bg-muted/40 px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Code de suivi</p>
          <p className="mt-1 text-2xl font-bold tracking-wider text-primary">{created.code_suivi}</p>
        </div>
        <p className="mt-4 text-sm font-medium">Statut : En attente</p>
        <Link to="/demande-volontaire/suivi" className={buttonVariants({ className: "mt-6 gap-2" })}>Consulter le suivi <ArrowRight className="size-4" /></Link>
      </CardContent>
    </Card> : <>

    {!loading && !session ? <Card className="mx-auto mt-8 max-w-3xl shadow-xl shadow-primary/5">
      <CardContent className="py-10 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground"><UserPlus className="size-6" /></div>
        <h2 className="mt-5 text-2xl font-semibold">Les inscriptions volontaires sont actuellement fermées</h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Aucune session n’accepte de nouvelles demandes pour le moment. Revenez pendant la prochaine période d’inscription.</p>
        <Link
          to="/"
          className={buttonVariants({
            variant: "outline",
            className: "mt-6 gap-2",
          })}
        >
          <ArrowLeft className="size-4" />
          Retour à l’accueil
        </Link>
      </CardContent>
    </Card> : null}

    {session ? <>
      <Card className="mx-auto mt-6 max-w-6xl shadow-lg shadow-primary/5">
        <CardContent className="grid gap-4 p-5 lg:grid-cols-[1.1fr_1fr_1fr] lg:items-center">
          <div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Session ouverte</p><h2 className="mt-1 text-xl font-semibold">{session.nom}</h2><p className="mt-1 text-sm text-muted-foreground">{session.type_session_libelle}</p></div>
          <div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Période d’inscription</p><p className="mt-1 font-medium">Du {formatDate(session.date_ouverture_inscription)} au {formatDate(session.date_fermeture_inscription)}</p></div>
          <div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Période d’immersion</p><p className="mt-1 font-medium">Du {formatDate(session.date_debut)} au {formatDate(session.date_fin)}</p></div>
          {(session.description || session.directives_generales || session.documents_exiges.length > 0) && <div className="border-t pt-4 lg:col-span-3">
            {session.description && <p className="text-sm leading-6">{session.description}</p>}
            <div className="mt-3 grid gap-4 lg:grid-cols-2">
              {session.directives_generales && <div><p className="text-sm font-medium">Directives utiles</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{session.directives_generales}</p></div>}
              {session.documents_exiges.length > 0 && <div><p className="flex items-center gap-2 text-sm font-medium"><FileText className="size-4" />Documents à prévoir</p><p className="mt-1 text-sm text-muted-foreground">{session.documents_exiges.join(" · ")}</p></div>}
            </div>
          </div>}
        </CardContent>
      </Card>

      <Card className="mx-auto mt-5 max-w-6xl shadow-xl shadow-primary/5">
        <CardHeader className="border-b py-4"><CardTitle className="text-xl">Informations du volontaire</CardTitle><CardDescription>Les champs marqués d’un astérisque sont obligatoires.</CardDescription></CardHeader>
        <CardContent className="pt-5">
          <form className="grid gap-x-4 gap-y-3 md:grid-cols-2 xl:grid-cols-4" onSubmit={handleSubmit}>
            <input type="hidden" name="session_id" value={session.id} />
            <div className="space-y-1.5"><Label htmlFor="nom">Nom *</Label><Input id="nom" name="nom" required className={fieldClassName} /></div>
            <div className="space-y-1.5"><Label htmlFor="prenoms">Prénom(s) *</Label><Input id="prenoms" name="prenoms" required className={fieldClassName} /></div>
            <div className="space-y-1.5"><Label htmlFor="sexe">Sexe *</Label><select id="sexe" name="sexe" className={selectClassName} defaultValue="" required><option value="" disabled>Choisir</option><option value="M">Masculin</option><option value="F">Féminin</option><option value="AUTRE">Autre</option></select></div>
            <div className="space-y-1.5"><Label htmlFor="date_naissance">Date de naissance *</Label><Input id="date_naissance" name="date_naissance" type="date" required className={fieldClassName} /></div>

            <div className="space-y-1.5"><Label htmlFor="lieu_naissance">Lieu de naissance</Label><Input id="lieu_naissance" name="lieu_naissance" className={fieldClassName} /></div>
            <div className="space-y-1.5"><Label htmlFor="nationalite">Nationalité</Label><Input id="nationalite" name="nationalite" className={fieldClassName} /></div>
            <div className="space-y-1.5"><Label htmlFor="numero_cnib">Numéro CNIB</Label><Input id="numero_cnib" name="numero_cnib" className={fieldClassName} /></div>
            <div className="space-y-1.5"><Label htmlFor="telephone">Téléphone *</Label><Input id="telephone" name="telephone" type="tel" required className={fieldClassName} placeholder="+226 XX XX XX XX" /></div>

            <div className="space-y-1.5"><Label htmlFor="email">Adresse e-mail</Label><Input id="email" name="email" type="email" className={fieldClassName} /></div>
            <div className="space-y-1.5"><Label htmlFor="region_residence">Région de résidence</Label><Input id="region_residence" name="region_residence" className={fieldClassName} /></div>
            <div className="space-y-1.5"><Label htmlFor="province_residence">Province de résidence</Label><Input id="province_residence" name="province_residence" className={fieldClassName} /></div>
            <div className="space-y-1.5"><Label htmlFor="commune_residence">Commune de résidence</Label><Input id="commune_residence" name="commune_residence" className={fieldClassName} /></div>

            <div className="space-y-1.5"><Label htmlFor="adresse_residence">Adresse de résidence</Label><Input id="adresse_residence" name="adresse_residence" className={fieldClassName} /></div>
            <div className="space-y-1.5"><Label htmlFor="niveau_etude">Niveau d’étude</Label><Input id="niveau_etude" name="niveau_etude" className={fieldClassName} /></div>
            <div className="space-y-1.5"><Label htmlFor="profession">Profession</Label><Input id="profession" name="profession" className={fieldClassName} /></div>
            <div className="space-y-1.5"><Label htmlFor="nom_contact_urgence">Nom du contact d’urgence</Label><Input id="nom_contact_urgence" name="nom_contact_urgence" className={fieldClassName} /></div>

            <div className="space-y-1.5"><Label htmlFor="contact_urgence">Téléphone d’urgence</Label><Input id="contact_urgence" name="contact_urgence" type="tel" className={fieldClassName} /></div>
            <div className="space-y-1.5 md:col-span-2 xl:col-span-3"><Label htmlFor="motivation">Motivation *</Label><textarea id="motivation" name="motivation" rows={2} required className="min-h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" /></div>

            <div className="rounded-lg border bg-muted/40 p-3 md:col-span-2 xl:col-span-3"><p className="flex items-start gap-2 text-sm text-muted-foreground"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />Après l’envoi, un code de suivi permettra de consulter le traitement de la demande.</p></div>
            <div className="md:col-span-2 xl:col-span-1"><Button type="submit" className="h-full min-h-10 w-full gap-2" disabled={!session || submitting}>{submitting ? <><LoaderCircle className="size-4 animate-spin" />Envoi en cours...</> : <>Soumettre ma demande<ArrowRight className="size-4" /></>}</Button></div>
          </form>
        </CardContent>
      </Card>
    </> : null}
    </>}
  </section>
}
