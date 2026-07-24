import { useEffect, useMemo, useState } from "react"
import {
  BedDouble,
  BookOpenCheck,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileText,
  LoaderCircle,
  MapPin,
  Search,
  ShieldCheck,
  UserRoundCheck,
  UserRoundSearch,
  UsersRound,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { documentsApi } from "@/features/documents/api"
import type { PublicArrivalInformation } from "@/features/documents/types"
import { sessionsApi } from "@/features/sessions/api"
import type { ArrivalConsultationSession, SessionType } from "@/features/sessions/types"

const categories: Array<{
  type: SessionType
  label: string
  description: string
  icon: typeof BookOpenCheck
}> = [
  { type: "examen", label: "Examens", description: "BAC ou BEPC", icon: BookOpenCheck },
  { type: "concours", label: "Concours", description: "Candidats admis aux concours", icon: BriefcaseBusiness },
  { type: "selectionne", label: "Personnes sélectionnées", description: "Sélections officielles", icon: UserRoundCheck },
  { type: "volontaire", label: "Volontaires", description: "Demandes de volontariat acceptées", icon: UsersRound },
]

const centreInstructionLabels: Record<string, string> = {
  accueil: "Accueil",
  consignes_accueil: "Accueil",
  hebergement: "Hébergement",
  consignes_hebergement: "Hébergement",
  kits: "Kits",
  consignes_kits: "Kits",
  repas: "Repas",
  consignes_repas: "Repas",
  discipline: "Discipline",
  regles_discipline: "Discipline",
  directives_locales: "Directives du centre",
  horaires_generaux: "Horaires généraux",
}

function getApiErrorMessage(
  error: unknown,
  fallback = "Une erreur est survenue. Veuillez réessayer.",
): string {
  if (typeof error !== "object" || error === null) return fallback

  const response =
    "response" in error
      ? (error as { response?: { data?: unknown } }).response
      : undefined

  const data = response?.data

  if (typeof data === "string" && data.trim()) return data

  if (typeof data === "object" && data !== null) {
    const payload = data as Record<string, unknown>

    for (const key of ["detail", "message", "error", "non_field_errors"]) {
      const value = payload[key]

      if (typeof value === "string" && value.trim()) return value

      if (Array.isArray(value) && typeof value[0] === "string" && value[0].trim()) {
        return value[0]
      }
    }
  }

  if ("message" in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === "string" && message.trim()) return message
  }

  return fallback
}

function fieldFor(session: ArrivalConsultationSession) {
  if (session.public_cible === "BAC" || session.public_cible === "BEPC") {
    return {
      label: `Numéro PV ${session.public_cible}`,
      placeholder: "Saisissez votre numéro PV",
      typeImmerge: session.public_cible,
    }
  }

  if (session.public_cible === "CONCOURS") {
    return {
      label: "Numéro de récépissé",
      placeholder: "Saisissez votre numéro de récépissé",
      typeImmerge: "CONCOURS",
    }
  }

  if (session.public_cible === "SELECTIONNE") {
    return {
      label: "Matricule ou référence de sélection",
      placeholder: "Saisissez votre matricule ou votre référence",
      typeImmerge: "SELECTIONNE",
    }
  }

  return {
    label: "Code de suivi de la demande",
    placeholder: "Saisissez votre code de suivi",
    typeImmerge: "VOLONTAIRE",
  }
}

function hasText(value?: string | null): value is string {
  return typeof value === "string" && value.trim().length > 0
}

function normalizeInstructionLabel(key: string) {
  if (centreInstructionLabels[key]) return centreInstructionLabels[key]

  return key
    .replaceAll("_", " ")
    .replace(/^\w/, (letter) => letter.toUpperCase())
}

export function ConsultationPage() {
  const [sessions, setSessions] = useState<ArrivalConsultationSession[]>([])
  const [selectedType, setSelectedType] = useState<SessionType | null>(null)
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null)
  const [identifier, setIdentifier] = useState("")
  const [birthDate, setBirthDate] = useState("")
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<PublicArrivalInformation | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void sessionsApi
        .publicArrivalSessions()
        .then((rows) => {
          setSessions(rows)
          const activeTypes = [...new Set(rows.map((row) => row.type_session))]
          if (activeTypes.length === 1) setSelectedType(activeTypes[0])
          if (rows.length === 1) setSelectedSessionId(rows[0].id)
        })
        .catch((exception) => setError(getApiErrorMessage(exception)))
        .finally(() => setLoading(false))
    }, 0)

    return () => window.clearTimeout(timer)
  }, [])

  const availableCategories = useMemo(
    () =>
      categories.filter((category) =>
        sessions.some((session) => session.type_session === category.type),
      ),
    [sessions],
  )

  const typeSessions = useMemo(
    () => sessions.filter((session) => session.type_session === selectedType),
    [sessions, selectedType],
  )

  const selectedSession =
    sessions.find((session) => session.id === selectedSessionId) ??
    (typeSessions.length === 1 ? typeSessions[0] : null)

  const field = selectedSession ? fieldFor(selectedSession) : null

  const centreInstructions = useMemo(() => {
    if (!result) return []

    return Object.entries(result.consignes_centre ?? {})
      .filter(([, value]) => hasText(value))
      .map(([key, value]) => ({
        label: normalizeInstructionLabel(key),
        value: value.trim(),
      }))
  }, [result])

  function chooseType(type: SessionType) {
    setSelectedType(type)
    const rows = sessions.filter((session) => session.type_session === type)
    setSelectedSessionId(rows.length === 1 ? rows[0].id : null)
    setIdentifier("")
    setBirthDate("")
    setResult(null)
    setError("")
  }

  function resetSearch() {
    setIdentifier("")
    setBirthDate("")
    setResult(null)
    setError("")
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedSession || !field || !identifier.trim() || !birthDate) return

    setSearching(true)
    setError("")

    try {
      const response = await documentsApi.publicArrival({
        type_immerge: field.typeImmerge,
        identifiant: identifier.trim(),
        session_code: selectedSession.code,
        date_naissance: birthDate,
      })
      setResult(response)
    } catch (exception) {
      setError(getApiErrorMessage(exception))
    } finally {
      setSearching(false)
    }
  }

  const hasAssignment =
    !!result &&
    [
      result.affectation.region,
      result.affectation.centre,
      result.affectation.province,
      result.affectation.ville,
      result.affectation.adresse,
    ].some(hasText)

  const hasOrganisation =
    !!result &&
    [
      result.affectation.section,
      result.affectation.groupe,
      result.hebergement?.dortoir,
      result.hebergement?.lit,
    ].some(hasText)

  const hasArrival =
    !!result &&
    [
      result.affectation.lieu_accueil,
      result.affectation.heure_accueil,
      result.affectation.horaires_generaux,
      result.session.date_debut,
      result.session.date_fin,
    ].some(hasText)

  const hasSessionInstructions =
    !!result &&
    [
      result.session.directives_generales,
      result.session.consignes_generales,
    ].some(hasText)

  const documentsRequired = result?.session.documents_exiges?.filter(hasText) ?? []
  const kitsToBring = result?.kits_a_apporter?.filter((item) => hasText(item.designation)) ?? []

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="mx-auto mb-10 max-w-4xl text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <UserRoundSearch className="size-8" />
        </span>
        <p className="mt-5 text-sm font-semibold uppercase tracking-[0.24em] text-primary">
          Espace public
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          Consulter mon immersion
        </h1>
        <p className="mt-4 text-lg leading-8 text-muted-foreground">
          Retrouvez rapidement votre centre, votre organisation et les consignes d’arrivée.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <LoaderCircle className="size-9 animate-spin text-primary" />
        </div>
      ) : null}

      {!loading && sessions.length === 0 ? (
        <Card className="mx-auto max-w-4xl border-border/70 shadow-lg shadow-primary/5">
          <CardContent className="p-10 text-center">
            <h2 className="text-2xl font-semibold">Aucune consultation ouverte</h2>
            <p className="mt-3 text-base text-muted-foreground">
              Les informations d’arrivée ne sont pas encore disponibles.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {!loading && availableCategories.length > 1 && !selectedType ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {availableCategories.map(({ type, label, description, icon: Icon }) => (
            <button
              key={type}
              type="button"
              onClick={() => chooseType(type)}
              className="rounded-2xl border bg-card p-7 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary hover:shadow-lg"
            >
              <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-6" />
              </span>
              <h2 className="mt-5 text-xl font-semibold">{label}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
            </button>
          ))}
        </div>
      ) : null}

      {selectedType && typeSessions.length > 1 && !selectedSession ? (
        <Card className="mx-auto max-w-4xl border-border/70 shadow-lg shadow-primary/5">
          <CardHeader className="border-b px-7 py-7 sm:px-10">
            <CardTitle className="text-2xl">Quel examen avez-vous passé ?</CardTitle>
            <CardDescription className="text-base">Choisissez BAC ou BEPC.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 px-7 py-8 sm:grid-cols-2 sm:px-10">
            {typeSessions.map((session) => (
              <Button
                key={session.id}
                variant="outline"
                className="h-16 text-lg"
                onClick={() => setSelectedSessionId(session.id)}
              >
                {session.public_cible_libelle}
              </Button>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {selectedSession && field && !result ? (
        <Card className="mx-auto max-w-5xl overflow-hidden border-border/70 shadow-xl shadow-primary/5">
          <CardHeader className="border-b bg-muted/20 px-7 py-7 sm:px-10">
            <CardTitle className="text-2xl sm:text-3xl">
              Retrouver mes informations d’arrivée
            </CardTitle>
            <CardDescription className="mt-1 text-base">
              {selectedSession.nom} · {selectedSession.public_cible_libelle}
            </CardDescription>
          </CardHeader>

          <CardContent className="px-7 py-9 sm:px-10">
            <form className="grid gap-7 md:grid-cols-2" onSubmit={submit}>
              <div className="space-y-3">
                <Label htmlFor="identifiant" className="text-base font-semibold">
                  {field.label}
                </Label>
                <Input
                  id="identifiant"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  placeholder={field.placeholder}
                  autoComplete="off"
                  className="h-14 rounded-xl px-4 text-base sm:text-lg"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="date-naissance" className="text-base font-semibold">
                  Date de naissance
                </Label>
                <Input
                  id="date-naissance"
                  type="date"
                  value={birthDate}
                  onChange={(event) => setBirthDate(event.target.value)}
                  className="h-14 rounded-xl px-4 text-base sm:text-lg"
                />
              </div>

              <div className="flex flex-wrap gap-3 md:col-span-2">
                <Button
                  type="submit"
                  size="lg"
                  disabled={searching || !identifier.trim() || !birthDate}
                  className="h-12 gap-2 px-7 text-base"
                >
                  {searching ? (
                    <LoaderCircle className="size-5 animate-spin" />
                  ) : (
                    <Search className="size-5" />
                  )}
                  Consulter mes informations
                </Button>

                {availableCategories.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="lg"
                    onClick={() => {
                      setSelectedType(null)
                      setSelectedSessionId(null)
                      setResult(null)
                      setError("")
                    }}
                  >
                    Changer de catégorie
                  </Button>
                ) : null}
              </div>
            </form>

            {error ? (
              <p className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                {error}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {result ? (
        <Card className="mx-auto max-w-5xl overflow-hidden border-border/70 shadow-xl shadow-primary/5">
          <div className="bg-primary px-7 py-8 text-primary-foreground sm:px-10">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] opacity-80">
              Informations d’arrivée
            </p>
            <h2 className="mt-2 text-3xl font-bold">{result.immerge.nom_complet}</h2>
            <p className="mt-2 text-base opacity-90">{result.session.nom}</p>
          </div>

          <CardContent className="space-y-7 px-7 py-8 sm:px-10">
            {(hasAssignment || hasOrganisation) ? (
              <div className="grid gap-5 md:grid-cols-2">
                {hasAssignment ? (
                  <div className="rounded-2xl border bg-muted/20 p-6">
                    <div className="flex items-center gap-3">
                      <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Building2 className="size-5" />
                      </span>
                      <h3 className="text-lg font-semibold">Votre affectation</h3>
                    </div>
                    <dl className="mt-5 space-y-3 text-sm">
                      {hasText(result.affectation.region) ? (
                        <div>
                          <dt className="text-muted-foreground">Région</dt>
                          <dd className="font-medium">{result.affectation.region}</dd>
                        </div>
                      ) : null}
                      {hasText(result.affectation.centre) ? (
                        <div>
                          <dt className="text-muted-foreground">Centre d’accueil</dt>
                          <dd className="font-medium">{result.affectation.centre}</dd>
                        </div>
                      ) : null}
                      {[result.affectation.province, result.affectation.ville, result.affectation.adresse].some(hasText) ? (
                        <div>
                          <dt className="text-muted-foreground">Localisation</dt>
                          <dd className="font-medium">
                            {[result.affectation.province, result.affectation.ville, result.affectation.adresse]
                              .filter(hasText)
                              .join(" · ")}
                          </dd>
                        </div>
                      ) : null}
                    </dl>
                  </div>
                ) : null}

                {hasOrganisation ? (
                  <div className="rounded-2xl border bg-muted/20 p-6">
                    <div className="flex items-center gap-3">
                      <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <UsersRound className="size-5" />
                      </span>
                      <h3 className="text-lg font-semibold">Votre organisation</h3>
                    </div>
                    <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
                      {hasText(result.affectation.section) ? (
                        <div>
                          <dt className="text-muted-foreground">Section</dt>
                          <dd className="font-medium">{result.affectation.section}</dd>
                        </div>
                      ) : null}
                      {hasText(result.affectation.groupe) ? (
                        <div>
                          <dt className="text-muted-foreground">Groupe</dt>
                          <dd className="font-medium">{result.affectation.groupe}</dd>
                        </div>
                      ) : null}
                      {hasText(result.hebergement?.dortoir) ? (
                        <div>
                          <dt className="text-muted-foreground">Dortoir</dt>
                          <dd className="font-medium">{result.hebergement?.dortoir}</dd>
                        </div>
                      ) : null}
                      {hasText(result.hebergement?.lit) ? (
                        <div>
                          <dt className="text-muted-foreground">Lit</dt>
                          <dd className="font-medium">{result.hebergement?.lit}</dd>
                        </div>
                      ) : null}
                    </dl>
                  </div>
                ) : null}
              </div>
            ) : null}

            {hasArrival ? (
              <div className="rounded-2xl border bg-muted/20 p-6">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <MapPin className="size-5" />
                  </span>
                  <h3 className="text-lg font-semibold">Votre arrivée</h3>
                </div>

                <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {hasText(result.affectation.lieu_accueil) ? (
                    <div className="flex gap-3">
                      <MapPin className="mt-0.5 size-5 shrink-0 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Lieu d’accueil</p>
                        <p className="font-medium">{result.affectation.lieu_accueil}</p>
                      </div>
                    </div>
                  ) : null}

                  {hasText(result.affectation.heure_accueil) ? (
                    <div className="flex gap-3">
                      <Clock3 className="mt-0.5 size-5 shrink-0 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Heure d’accueil</p>
                        <p className="font-medium">{result.affectation.heure_accueil}</p>
                      </div>
                    </div>
                  ) : null}

                  {hasText(result.affectation.horaires_generaux) ? (
                    <div className="flex gap-3">
                      <Clock3 className="mt-0.5 size-5 shrink-0 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Horaires généraux</p>
                        <p className="whitespace-pre-line font-medium">
                          {result.affectation.horaires_generaux}
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {hasText(result.session.date_debut) && hasText(result.session.date_fin) ? (
                    <div className="flex gap-3">
                      <CalendarDays className="mt-0.5 size-5 shrink-0 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Période</p>
                        <p className="font-medium">
                          {result.session.date_debut} au {result.session.date_fin}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {hasSessionInstructions ? (
              <div className="rounded-2xl border bg-muted/20 p-6">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <ShieldCheck className="size-5" />
                  </span>
                  <h3 className="text-lg font-semibold">Consignes générales</h3>
                </div>

                <div className="mt-5 space-y-5">
                  {hasText(result.session.directives_generales) ? (
                    <div>
                      <h4 className="font-semibold">Directives</h4>
                      <p className="mt-2 whitespace-pre-line leading-7 text-muted-foreground">
                        {result.session.directives_generales}
                      </p>
                    </div>
                  ) : null}

                  {hasText(result.session.consignes_generales) ? (
                    <div>
                      <h4 className="font-semibold">Consignes</h4>
                      <p className="mt-2 whitespace-pre-line leading-7 text-muted-foreground">
                        {result.session.consignes_generales}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {documentsRequired.length > 0 ? (
              <div className="rounded-2xl border bg-muted/20 p-6">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <FileText className="size-5" />
                  </span>
                  <h3 className="text-lg font-semibold">Documents à présenter</h3>
                </div>
                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {documentsRequired.map((document, index) => (
                    <li
                      key={`${document}-${index}`}
                      className="flex items-start gap-3 rounded-xl border bg-background p-4"
                    >
                      <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
                      <span>{document}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {centreInstructions.length > 0 ? (
              <div className="rounded-2xl border bg-muted/20 p-6">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <ClipboardList className="size-5" />
                  </span>
                  <h3 className="text-lg font-semibold">Consignes de votre centre</h3>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {centreInstructions.map((instruction) => (
                    <div key={`${instruction.label}-${instruction.value}`} className="rounded-xl border bg-background p-5">
                      <h4 className="font-semibold">{instruction.label}</h4>
                      <p className="mt-2 whitespace-pre-line leading-7 text-muted-foreground">
                        {instruction.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {kitsToBring.length > 0 ? (
              <div className="rounded-2xl border bg-muted/20 p-6">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <BedDouble className="size-5" />
                  </span>
                  <h3 className="text-lg font-semibold">Articles à apporter</h3>
                </div>
                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {kitsToBring.map((item, index) => (
                    <li key={`${item.designation}-${index}`} className="rounded-xl border bg-background p-4">
                      <p className="font-medium">{item.designation}</p>
                      {hasText(item.description) ? (
                        <p className="mt-2 leading-6 text-muted-foreground">
                          {item.description}
                        </p>
                      ) : null}
                      <p className="mt-2 text-sm text-muted-foreground">
                        Quantité : {item.quantite} {item.unite}
                        {item.obligatoire ? " · Obligatoire" : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="flex justify-end">
              <Button type="button" variant="outline" size="lg" onClick={resetSearch}>
                Faire une autre recherche
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </section>
  )
}
