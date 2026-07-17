import { LogOut } from "lucide-react"
import { NavLink, Outlet, useNavigate } from "react-router-dom"

import { Brand } from "@/components/common/brand"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/auth-store"
import { getWorkspaceNavigation } from "@/workspaces/workspace-navigation"

export function AppLayout() {
  const navigate = useNavigate()
  const context = useAuthStore((state) => state.context)
  const logout = useAuthStore((state) => state.logout)
  const assignment = context?.affectation_courante
  const actor = context?.acteur
  const navigation = getWorkspaceNavigation()

  function handleLogout() {
    logout()
    navigate("/espace-acteur/connexion", { replace: true })
  }

  return (
    <div className="h-screen overflow-hidden bg-muted/30">
      <header className="sticky top-0 z-40 border-b-4 border-primary bg-background/95 shadow-sm backdrop-blur-xl">
        <div className="h-1.5 bg-red-600" aria-hidden="true" />
        <div className="mx-auto flex min-h-20 max-w-none items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Brand />

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">{actor?.nom_complet || actor?.username}</p>
              <p className="text-xs text-muted-foreground">
                {assignment?.roles.map((role) => role.libelle).join(" · ") || "Aucune affectation active"}
              </p>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={handleLogout}>
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Déconnexion</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid h-[calc(100vh-5.5rem)] max-w-none md:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden h-full overflow-y-auto border-r bg-background p-4 md:block">
          <nav className="space-y-2" aria-label="Navigation de l’application">
            {navigation.map((section) => (
              <div key={section.label}>
                <div className="space-y-1">
                  {section.items.map(({ label, href, icon: Icon, end }) => (
                    <NavLink
                      key={href}
                      to={href}
                      end={end}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                          isActive && "bg-primary/10 text-primary",
                        )
                      }
                    >
                      <Icon className="size-5" />
                      {label}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>

        </aside>

        <main className="min-h-0 min-w-0 overflow-y-auto p-3 sm:p-4 lg:p-5">
          <div className="mb-5 flex gap-2 overflow-x-auto pb-2 md:hidden">
            {navigation.flatMap((section) => section.items).map(({ label, href, icon: Icon, end }) => (
              <NavLink
                key={href}
                to={href}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "flex shrink-0 items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm",
                    isActive && "border-primary bg-primary/10 text-primary",
                  )
                }
              >
                <Icon className="size-4" />
                {label}
              </NavLink>
            ))}
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
