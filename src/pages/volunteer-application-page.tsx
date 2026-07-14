import { useEffect, useState } from "react"
import { ArrowRight, CheckCircle2, FileText, UserPlus } from "lucide-react"

import { getApiErrorMessage } from "@/api/api-error"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { sessionsApi } from "@/features/sessions/api"
import { formatDate } from "@/features/sessions/labels"
import type { PublicSession } from "@/features/sessions/types"

const selectClassName = "h-12 w-full rounded-xl border border-input bg-background px-3 text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"

export function VolunteerApplicationPage() {
  const [sessions, setSessions] = useState<PublicSession[]>([])
  const [sessionId, setSessionId] = useState("")
  const [error, setError] = useState("")
  const selected = sessions.find((session) => String(session.id) === sessionId)

  useEffect(() => {
    sessionsApi.publicOpenSessions().then((rows) => {
      setSessions(rows)
      if (rows.length === 1) setSessionId(String(rows[0].id))
    }).catch((exception) => setError(getApiErrorMessage(exception)))
  }, [])

  return <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-3xl text-center">
      <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><UserPlus className="size-7" /></span>
      <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">Demande de participation volontaire</h1>
      <p className="mt-4 text-lg leading-8 text-muted-foreground">Choisissez une session ouverte, consultez les informations utiles, puis renseignez votre demande.</p>
    </div>

    {error && <div className="mx-auto mt-8 max-w-5xl rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}

    <Card className="mx-auto mt-10 max-w-5xl shadow-xl shadow-primary/5">
      <CardHeader className="border-b"><CardTitle className="text-2xl">Session souhaitée</CardTitle><CardDescription className="text-base">Seules les sessions actuellement ouvertes aux volontaires sont affichées.</CardDescription></CardHeader>
      <CardContent className="pt-8">
        {sessions.length === 0 ? <p className="rounded-xl border bg-muted/40 p-5 text-muted-foreground">Aucune session volontaire n’est ouverte actuellement.</p> : <div className="space-y-5">
          <div className="space-y-2"><Label htmlFor="session">Session d’immersion *</Label><select id="session" className={selectClassName} value={sessionId} onChange={(event) => setSessionId(event.target.value)} required><option value="">Choisir une session</option>{sessions.map((session) => <option key={session.id} value={session.id}>{session.nom} · du {formatDate(session.date_debut)} au {formatDate(session.date_fin)}</option>)}</select></div>
          {selected && <div className="rounded-2xl border bg-muted/30 p-5"><h3 className="text-lg font-semibold">{selected.nom}</h3><p className="mt-2 text-sm text-muted-foreground">Inscriptions du {formatDate(selected.date_ouverture_inscription)} au {formatDate(selected.date_fermeture_inscription)}</p>{selected.description && <p className="mt-4 leading-7">{selected.description}</p>}{selected.directives_generales && <div className="mt-4"><p className="font-medium">Directives utiles</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{selected.directives_generales}</p></div>}{selected.documents_exiges.length > 0 && <div className="mt-4"><p className="flex items-center gap-2 font-medium"><FileText className="size-4" />Documents à prévoir</p><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">{selected.documents_exiges.map((document, index) => <li key={`${document}-${index}`}>{document}</li>)}</ul></div>}</div>}
        </div>}
      </CardContent>
    </Card>

    <Card className="mx-auto mt-6 max-w-5xl shadow-xl shadow-primary/5">
      <CardHeader className="border-b"><CardTitle className="text-2xl">Informations du volontaire</CardTitle><CardDescription className="text-base">Les champs marqués d’un astérisque sont obligatoires.</CardDescription></CardHeader>
      <CardContent className="pt-8">
        <form className="grid gap-6 sm:grid-cols-2" onSubmit={(event) => event.preventDefault()}>
          <input type="hidden" name="session_id" value={sessionId} />
          <div className="space-y-2"><Label htmlFor="nom">Nom *</Label><Input id="nom" name="nom" required className="h-12 text-base" /></div>
          <div className="space-y-2"><Label htmlFor="prenoms">Prénom(s)</Label><Input id="prenoms" name="prenoms" className="h-12 text-base" /></div>
          <div className="space-y-2"><Label htmlFor="sexe">Sexe</Label><select id="sexe" name="sexe" className={selectClassName} defaultValue=""><option value="">Non précisé</option><option value="M">Masculin</option><option value="F">Féminin</option><option value="AUTRE">Autre</option></select></div>
          <div className="space-y-2"><Label htmlFor="date_naissance">Date de naissance</Label><Input id="date_naissance" name="date_naissance" type="date" className="h-12 text-base" /></div>
          <div className="space-y-2"><Label htmlFor="lieu_naissance">Lieu de naissance</Label><Input id="lieu_naissance" name="lieu_naissance" className="h-12 text-base" /></div>
          <div className="space-y-2"><Label htmlFor="nationalite">Nationalité</Label><Input id="nationalite" name="nationalite" className="h-12 text-base" /></div>
          <div className="space-y-2"><Label htmlFor="numero_cnib">Numéro CNIB</Label><Input id="numero_cnib" name="numero_cnib" className="h-12 text-base" /></div>
          <div className="space-y-2"><Label htmlFor="telephone">Téléphone *</Label><Input id="telephone" name="telephone" type="tel" required className="h-12 text-base" placeholder="+226 XX XX XX XX" /></div>
          <div className="space-y-2"><Label htmlFor="email">Adresse e-mail</Label><Input id="email" name="email" type="email" className="h-12 text-base" /></div>
          <div className="space-y-2"><Label htmlFor="nom_contact_urgence">Nom du contact d’urgence</Label><Input id="nom_contact_urgence" name="nom_contact_urgence" className="h-12 text-base" /></div>
          <div className="space-y-2"><Label htmlFor="contact_urgence">Téléphone du contact d’urgence</Label><Input id="contact_urgence" name="contact_urgence" type="tel" className="h-12 text-base" /></div>
          <div className="space-y-2"><Label htmlFor="region_residence">Région de résidence</Label><Input id="region_residence" name="region_residence" className="h-12 text-base" /></div>
          <div className="space-y-2"><Label htmlFor="province_residence">Province de résidence</Label><Input id="province_residence" name="province_residence" className="h-12 text-base" /></div>
          <div className="space-y-2"><Label htmlFor="commune_residence">Commune de résidence</Label><Input id="commune_residence" name="commune_residence" className="h-12 text-base" /></div>
          <div className="space-y-2"><Label htmlFor="adresse_residence">Adresse de résidence</Label><Input id="adresse_residence" name="adresse_residence" className="h-12 text-base" /></div>
          <div className="space-y-2"><Label htmlFor="niveau_etude">Niveau d’étude</Label><Input id="niveau_etude" name="niveau_etude" className="h-12 text-base" /></div>
          <div className="space-y-2"><Label htmlFor="profession">Profession</Label><Input id="profession" name="profession" className="h-12 text-base" /></div>
          <div className="space-y-2 sm:col-span-2"><Label htmlFor="motivation">Motivation</Label><textarea id="motivation" name="motivation" rows={5} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" /></div>
          <div className="rounded-xl border bg-muted/40 p-4 sm:col-span-2"><p className="flex items-start gap-3 text-sm leading-6 text-muted-foreground"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />Après l’envoi, un code de suivi permettra de consulter le traitement de la demande.</p></div>
          <div className="sm:col-span-2"><Button type="submit" size="lg" className="w-full gap-2 text-base" disabled={!sessionId}>Soumettre ma demande<ArrowRight className="size-4" /></Button></div>
        </form>
      </CardContent>
    </Card>
  </section>
}
