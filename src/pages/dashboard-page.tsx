import { ArrowRight, CalendarRange, Clock3, KeyRound, MapPin, MapPinned, Shield, ShieldCheck, Users } from "lucide-react"
import { Link } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ACCOUNT_GROUPS } from "@/features/accounts/groups"
import { useAuthStore } from "@/stores/auth-store"

const roleMessages: Record<string, { title: string; description: string }> = {
  ADMINISTRATEUR: { title: "Administration de la plateforme", description: "Supervisez les acteurs, les rôles, les permissions et le fonctionnement général de FasoIM." },
  DGAS: { title: "Pilotage national des immersions", description: "Suivez les sessions, les affectations, les centres, les résultats et les publications nationales." },
  DIRECTEUR_REGIONAL: { title: "Pilotage régional des immersions", description: "Organisez les affectations et suivez les centres relevant de votre région." },
  RESPONSABLE_CENTRE: { title: "Gestion de votre centre", description: "Organisez l’accueil, l’hébergement et le suivi quotidien des immergés de votre centre." },
  FORMATEUR: { title: "Suivi des activités de formation", description: "Consultez les participants et enregistrez les activités, présences et évaluations prévues." },
  AGENT_SANTE: { title: "Suivi médical des immergés", description: "Gérez les visites médicales, les restrictions et les informations utiles au suivi sanitaire." },
}

type ModuleAccess = { label: string; description: string; href: string; permissions: readonly string[]; icon: typeof Users }

const accountsModules: ModuleAccess[] = [
  { label: "Gestion des acteurs", description: "Lister, créer, consulter, modifier, désactiver ou réactiver les acteurs.", href: "/app/acteurs", permissions: ACCOUNT_GROUPS.ACTORS, icon: Users },
  { label: "Gestion des affectations", description: "Gérer les affectations, leurs rôles et leurs permissions directes.", href: "/app/affectations", permissions: ACCOUNT_GROUPS.ASSIGNMENTS, icon: MapPin },
  { label: "Gestion des rôles", description: "Créer et gérer les rôles ainsi que les permissions qui leur sont associées.", href: "/app/roles", permissions: ACCOUNT_GROUPS.ROLES, icon: Shield },
  { label: "Gestion des permissions", description: "Consulter le catalogue et accéder aux demandes de permissions.", href: "/app/permissions", permissions: ACCOUNT_GROUPS.PERMISSIONS, icon: KeyRound },
]

export function DashboardPage() {
  const context = useAuthStore((state) => state.context)
  const assignment = context?.affectation_courante
  const primaryRole = assignment?.roles[0]
  const permissions = assignment?.permissions ?? []
  const message = roleMessages[primaryRole?.code ?? ""] ?? { title: "Bienvenue dans votre espace FasoIM", description: "Retrouvez les opérations disponibles dans votre contexte de travail actuel." }
  const visibleModules = accountsModules.filter((module) => module.permissions.some((code) => permissions.includes(code)))
  const quickAccess = visibleModules.slice(0, 4)

  return <div className="space-y-6">
    <section className="rounded-2xl bg-primary px-6 py-6 text-primary-foreground shadow-lg sm:px-8">
      <Badge variant="secondary" className="mb-3">{primaryRole?.libelle || "Espace acteur"}</Badge>
      <h1 className="text-3xl font-bold tracking-tight">{message.title}</h1>
      <p className="mt-2 max-w-3xl text-base leading-6 text-primary-foreground/85">{message.description}</p>
    </section>

    {!assignment ? <Card className="border-amber-300 bg-amber-50"><CardContent className="p-6"><h2 className="text-xl font-semibold">Aucune affectation active</h2><p className="mt-2 text-base text-muted-foreground">Votre compte est actif, mais aucune affectation ne vous permet encore d’accéder aux modules de travail.</p></CardContent></Card> : <>
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
              <p className="text-sm text-muted-foreground">Permissions actives</p>
              <p className="mt-1 text-lg font-semibold">{permissions.length}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Accès immédiat</p>
        <h2 className="mt-1 text-2xl font-bold">Actions rapides</h2>
        {quickAccess.length ? <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{quickAccess.map(({ label, description, href, icon: Icon }) => <Link key={href} to={href} className="group rounded-2xl border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"><div className="flex items-start justify-between gap-4"><span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></span><ArrowRight className="size-5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" /></div><h3 className="mt-3 text-base font-semibold">{label}</h3><p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p></Link>)}</div> : <Card className="mt-4"><CardContent className="p-5"><h3 className="font-semibold">Aucun module Accounts disponible</h3><p className="mt-2 text-sm text-muted-foreground">Cette affectation ne possède actuellement aucune permission du module Accounts gérée par cette version du frontend.</p></CardContent></Card>}
      </section>

      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Comptes et autorisations</p>
        <h2 className="mt-1 text-2xl font-bold">Opérations disponibles</h2>
        <p className="mt-2 text-sm text-muted-foreground">Les opérations précises se trouvent à l’intérieur des interfaces ci-dessus. Les boutons y apparaissent selon vos permissions.</p>
      </section>
    </>}
  </div>
}
