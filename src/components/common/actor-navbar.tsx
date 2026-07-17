import { Menu, ShieldCheck } from "lucide-react"
import { NavLink } from "react-router-dom"

import { Brand } from "@/components/common/brand"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

const navigation = [
  { label: "Accueil", href: "/espace-acteur" },
  { label: "Consulter une immersion", href: "/espace-acteur/consultation" },
  { label: "Vérifier une attestation", href: "/espace-acteur/verification-attestation" },
]

export function ActorNavbar() {
  return (
    <header className="sticky top-0 z-50 border-b-4 border-primary bg-background/95 shadow-sm backdrop-blur-xl">
      <div className="h-1.5 bg-red-600" aria-hidden="true" />

      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Brand />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Navigation des acteurs internes">
          {navigation.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === "/espace-acteur"}
              className={({ isActive }) =>
                cn(
                  "rounded-lg px-4 py-2.5 text-base font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  isActive && "bg-primary/10 text-primary",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden lg:block">
          <Button
            render={<NavLink to="/espace-acteur/connexion" />}
            className="gap-2 px-5 text-base"
          >
            <ShieldCheck className="size-5" />
            Accéder à mon espace de travail
          </Button>
        </div>

        <Sheet>
          <SheetTrigger render={<Button variant="outline" size="icon" className="lg:hidden" />}>
            <Menu className="size-5" />
            <span className="sr-only">Ouvrir le menu</span>
          </SheetTrigger>

          <SheetContent side="right" className="w-[88%] max-w-sm p-0">
            <div className="h-1.5 bg-red-600" aria-hidden="true" />

            <SheetHeader className="border-b-4 border-primary p-5 text-left">
              <SheetTitle>
                <Brand />
              </SheetTitle>
            </SheetHeader>

            <nav className="flex flex-col gap-2 p-5" aria-label="Navigation mobile des acteurs internes">
              {navigation.map((item) => (
                <SheetClose
                  key={item.href}
                  render={
                    <NavLink
                      to={item.href}
                      end={item.href === "/espace-acteur"}
                      className={({ isActive }) =>
                        cn(
                          "rounded-xl px-4 py-3 text-base font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                          isActive && "bg-primary/10 text-primary",
                        )
                      }
                    />
                  }
                >
                  {item.label}
                </SheetClose>
              ))}

              <SheetClose
                render={
                  <Button
                    render={<NavLink to="/espace-acteur/connexion" />}
                    className="mt-3 w-full gap-2 text-base"
                  />
                }
              >
                <ShieldCheck className="size-4" />
                Accéder à la plateforme
              </SheetClose>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
