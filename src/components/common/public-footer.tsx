import { Brand } from "@/components/common/brand"

export function PublicFooter() {
  return (
    <footer className="border-t bg-muted/35">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-2 lg:px-8">
        <div className="space-y-4">
          <Brand />
          <p className="max-w-md text-sm leading-6 text-muted-foreground">
            Plateforme nationale de gestion des sessions d’immersion patriotique au Burkina Faso.
          </p>
        </div>

        <div className="md:text-right">
          <p className="text-sm font-semibold text-foreground">FasoIM</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Unité, civisme et engagement au service de la Nation.
          </p>
          <p className="mt-5 text-xs text-muted-foreground">
            © {new Date().getFullYear()} FasoIM. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  )
}
