import { ArrowRight, BedDouble, Building2, CalendarRange, Clock3, FileSpreadsheet, KeyRound, ListChecks, MapPin, MapPinned, PackageCheck, Route, Shield, ShieldCheck, Users } from "lucide-react"
import { Link } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ACCOUNT_GROUPS } from "@/features/accounts/groups"
import { AFFECTATION_GROUPS } from "@/features/affectations/groups"
import { IMPORT_GROUPS } from "@/features/imports/groups"
import { KITS_GROUPS } from "@/features/kits/groups"
import { ORGANISATION_GROUPS } from "@/features/organisation/groups"
import { VOLUNTEER_REQUEST_PERMISSIONS } from "@/features/volunteers/requests-permissions"
import { useAuthStore } from "@/stores/auth-store"
import { AdministrationDashboard } from "@/workspaces/administration/dashboard"
import { DgasDashboard } from "@/workspaces/dgas/dashboard"
import { RegionalDirectionDashboard } from "@/workspaces/direction-regionale/dashboard"
import { CenterManagerDashboard } from "@/workspaces/responsable-centre/dashboard"
import { resolveWorkspace } from "@/workspaces/workspace-resolver"

const roleMessages: Record<string, { title: string; description: string }> = {
  ADMINISTRATEUR: { title: "Administration de la plateforme", description: "Supervisez les acteurs, les rôles, les accès et le fonctionnement général de FasoIM." },
  DGAS: { title: "Pilotage national des immersions", description: "Suivez les sessions, les affectations, les centres, les résultats et les publications nationales." },
  DIRECTEUR_REGIONAL: { title: "Pilotage régional des immersions", description: "Organisez les affectations et suivez les centres relevant de votre région." },
  RESPONSABLE_CENTRE: { title: "Gestion de votre centre", description: "Organisez l’accueil, l’hébergement et le suivi quotidien des immergés de votre centre." },
  FORMATEUR: { title: "Suivi des activités de formation", description: "Consultez les participants et enregistrez les activités, présences et évaluations prévues." },
  AGENT_SANTE: { title: "Suivi médical des immergés", description: "Gérez les visites médicales, les restrictions et les informations utiles au suivi sanitaire." },
}

type ModuleAccess = { label: string; description: string; href: string; permissions: readonly string[]; icon: typeof Users; hiddenForLevels?: readonly string[]; onlyForLevels?: readonly string[] }

const accountsModules: ModuleAccess[] = [
  { label: "Acteurs", description: "Créer et mettre à jour les comptes des personnes qui travaillent dans FasoIM.", href: "/app/acteurs", permissions: ACCOUNT_GROUPS.ACTORS, icon: Users },
  { label: "Affectations des acteurs", description: "Définir où chaque acteur travaille et ce qu’il peut faire dans ce contexte.", href: "/app/affectations", permissions: ACCOUNT_GROUPS.ASSIGNMENTS, icon: MapPin },
  { label: "Rôles et responsabilités", description: "Préparer les responsabilités qui pourront être ajoutées aux affectations.", href: "/app/roles", permissions: ACCOUNT_GROUPS.ROLES, icon: Shield },
  { label: "Autorisations", description: "Consulter les accès disponibles et suivre les demandes d’autorisation.", href: "/app/permissions", permissions: ACCOUNT_GROUPS.PERMISSIONS, icon: KeyRound },
  { label: "Imports officiels", description: "Téléverser, contrôler et confirmer les listes officielles.", href: "/app/imports", permissions: IMPORT_GROUPS.MANAGEMENT, icon: FileSpreadsheet },
  { label: "Régions d’immersion", description: "Créer et mettre à jour les régions d’accueil.", href: "/app/regions", permissions: AFFECTATION_GROUPS.REGIONS, icon: MapPinned, hiddenForLevels: ["centre"] },
  { label: "Centres d’immersion", description: "Créer et mettre à jour les centres, leur localisation et leurs conditions d’accueil.", href: "/app/centres", permissions: AFFECTATION_GROUPS.CENTERS, icon: Building2, hiddenForLevels: ["centre"] },
  { label: "Affectations régionales", description: "Proposer, vérifier et valider les régions d’accueil des immergés.", href: "/app/affectations-regionales", permissions: AFFECTATION_GROUPS.REGIONAL_ASSIGNMENTS, icon: Route, hiddenForLevels: ["centre"] },
  { label: "Mon centre", description: "Voir les informations, la capacité et les accès de votre centre.", href: "/app/mon-centre", permissions: AFFECTATION_GROUPS.CENTERS, icon: Building2, onlyForLevels: ["centre"] },
  { label: "Organisation du centre", description: "Régler la capacité d’accueil, les sections, les groupes et les consignes.", href: "/app/organisation-centre", permissions: ORGANISATION_GROUPS.CENTER_ORGANIZATION, icon: ListChecks },
  { label: "Dortoirs", description: "Gérer les dortoirs rattachés aux centres d’accueil.", href: "/app/dortoirs", permissions: ORGANISATION_GROUPS.DORMITORIES, icon: Users },
  { label: "Lits", description: "Gérer les lits disponibles dans les dortoirs.", href: "/app/lits", permissions: ORGANISATION_GROUPS.BEDS, icon: BedDouble },
  { label: "Kits", description: "Gérer les articles à apporter, les articles à remettre et le suivi des remises.", href: "/app/kits", permissions: KITS_GROUPS.ACCESS, icon: PackageCheck },
  {
    label: "Demandes volontaires",
    description: "Consulter et traiter les demandes de participation volontaire.",
    href: "/app/demandes-volontaires",
    permissions: [
      VOLUNTEER_REQUEST_PERMISSIONS.LIST,
      VOLUNTEER_REQUEST_PERMISSIONS.VIEW,
      VOLUNTEER_REQUEST_PERMISSIONS.ACCEPT,
      VOLUNTEER_REQUEST_PERMISSIONS.REJECT,
      VOLUNTEER_REQUEST_PERMISSIONS.ACCEPT_BATCH,
    ],
    icon: Users,
  },
]

export function DashboardPage() {
  const context = useAuthStore((state) => state.context)
  const assignment = context?.affectation_courante
  const workspace = resolveWorkspace(assignment)

  if (workspace === "ADMINISTRATION") {
    return <AdministrationDashboard />
  }

  if (workspace === "DGAS") {
    return <DgasDashboard />
  }

  if (workspace === "DIRECTION_REGIONALE") {
    return <RegionalDirectionDashboard />
  }

  if (workspace === "RESPONSABLE_CENTRE") {
    return <CenterManagerDashboard />
  }
  const primaryRole = assignment?.roles[0]
  const permissions = assignment?.permissions ?? []
  const message = roleMessages[primaryRole?.code ?? ""] ?? { title: "Bienvenue dans votre espace FasoIM", description: "Retrouvez les opérations disponibles dans votre contexte de travail actuel." }
  const visibleModules = accountsModules.filter((module) => {
    const level = assignment?.niveau_affectation
    if (level && module.hiddenForLevels?.includes(level)) return false
    if (module.onlyForLevels && (!level || !module.onlyForLevels.includes(level))) return false
    return module.permissions.some((code) => permissions.includes(code))
  })
  const quickAccess = visibleModules

  return <div className="space-y-6">
    <section className="rounded-2xl bg-primary px-6 py-6 text-primary-foreground shadow-lg sm:px-8">
      <Badge variant="secondary" className="mb-3">{primaryRole?.libelle || "Espace acteur"}</Badge>
      <h1 className="text-3xl font-bold tracking-tight">{message.title}</h1>
      <p className="mt-2 max-w-3xl text-base leading-6 text-primary-foreground/85">{message.description}</p>
    </section>

    {!assignment ? <Card className="border-amber-300 bg-amber-50"><CardContent className="p-6"><h2 className="text-xl font-semibold">Aucune affectation active</h2><p className="mt-2 text-base text-muted-foreground">Votre compte est actif, mais aucune affectation ne vous permet encore d’accéder à un espace de travail.</p></CardContent></Card> : <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="overflow-hidden">
          <CardContent className="flex items-center gap-4 p-5">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Clock3 className="size-6" />
            </span>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Type d’affectation</p>
              <p className="mt-1 truncate text-lg font-semibold">
                {assignment.est_permanente ? "Permanente" : "Temporaire"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="flex items-center gap-4 p-5">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <MapPinned className="size-6" />
            </span>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Périmètre</p>
              <p className="mt-1 truncate text-lg font-semibold capitalize">
                {assignment.niveau_affectation}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="flex items-center gap-4 p-5">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <CalendarRange className="size-6" />
            </span>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Session</p>
              <p className="mt-1 truncate text-lg font-semibold">
                {assignment.session?.code || "Toutes les sessions"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="flex items-center gap-4 p-5">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck className="size-6" />
            </span>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Accès actifs</p>
              <p className="mt-1 text-lg font-semibold">{permissions.length}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Accès immédiat</p>
        <h2 className="mt-1 text-2xl font-bold">Actions rapides disponibles pour vous</h2>
        {quickAccess.length ? <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{quickAccess.map(({ label, description, href, icon: Icon }) => <Link key={href} to={href} className="group rounded-2xl border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"><div className="flex items-start justify-between gap-4"><span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></span><ArrowRight className="size-5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" /></div><h3 className="mt-3 text-base font-semibold">{label}</h3><p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p></Link>)}</div> : <Card className="mt-4"><CardContent className="p-5"><h3 className="font-semibold">Aucune opération disponible</h3><p className="mt-2 text-sm text-muted-foreground">Votre affectation actuelle ne donne accès à aucune opération supplémentaire.</p></CardContent></Card>}
      </section>
    </>}
  </div>
}
