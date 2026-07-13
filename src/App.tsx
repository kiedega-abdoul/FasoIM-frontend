import { Button } from "@/components/ui/button"

function App() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <section className="w-full max-w-xl space-y-6 rounded-2xl border bg-card p-8 text-center shadow-sm">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Plateforme nationale
          </p>

          <h1 className="text-4xl font-bold tracking-tight">
            FasoIM
          </h1>

          <p className="text-muted-foreground">
            Gestion des sessions d’immersion patriotique au Burkina Faso.
          </p>
        </div>

        <Button type="button">
          Accéder à la plateforme
        </Button>
      </section>
    </main>
  )
}

export default App
