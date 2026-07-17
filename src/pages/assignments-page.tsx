import { CalendarDays, Check, KeyRound, LoaderCircle, MapPin, ShieldCheck } from "lucide-react"
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { getApiErrorMessage } from "@/api/api-error"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAuthStore } from "@/stores/auth-store"

export function AssignmentsPage() {
  const navigate = useNavigate()
  const context = useAuthStore((state) => state.context)
  const assignments = useAuthStore((state) => state.assignments)
  const loading = useAuthStore((state) => state.assignmentsLoading)
  const loadAssignments = useAuthStore((state) => state.loadAssignments)
  const selectAssignment = useAuthStore((state) => state.selectAssignment)

  useEffect(() => {
    if (!assignments) {
      void loadAssignments().catch((error: unknown) => {
        toast.error(getApiErrorMessage(error))
      })
    }
  }, [assignments, loadAssignments])

  async function handleSelect(assignmentId: number) {
    try {
      await selectAssignment(assignmentId)
      toast.success("Affectation sélectionnée.")
      navigate("/app")
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Contexte de travail</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Mes affectations</h1>
        <p className="mt-3 max-w-3xl text-lg text-muted-foreground">
          Choisissez l’affectation dans laquelle vous souhaitez travailler. Vos menus et vos actions seront adaptés à ce contexte.
        </p>
      </div>


      {context?.affectation_courante && (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><ShieldCheck className="size-5" /></span>
              <div><p className="text-sm text-muted-foreground">Espace courant</p><p className="mt-1 text-lg font-semibold">{context.affectation_courante.roles.map((role) => role.libelle).join(", ") || "Non défini"}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><MapPin className="size-5" /></span>
              <div><p className="text-sm text-muted-foreground">Périmètre</p><p className="mt-1 text-lg font-semibold capitalize">{context.affectation_courante.niveau_affectation}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><CalendarDays className="size-5" /></span>
              <div><p className="text-sm text-muted-foreground">Session</p><p className="mt-1 text-lg font-semibold">{context.affectation_courante.session?.nom || "Toutes les sessions"}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><KeyRound className="size-5" /></span>
              <div><p className="text-sm text-muted-foreground">Accès actifs</p><p className="mt-1 text-lg font-semibold">{context.affectation_courante.permissions.length}</p></div>
            </CardContent>
          </Card>
        </section>
      )}

      {loading ? (
        <div className="flex min-h-48 items-center justify-center gap-3 text-muted-foreground">
          <LoaderCircle className="size-5 animate-spin text-primary" />
          Chargement de vos affectations…
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {assignments?.affectations.map((assignment) => {
            const isCurrent = context?.affectation_courante?.id === assignment.id

            return (
              <Card key={assignment.id} className={isCurrent ? "border-primary ring-1 ring-primary/20" : "border-border/70"}>
                <CardContent className="p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        {assignment.est_permanente && <Badge>Permanente</Badge>}
                        {assignment.est_par_defaut && <Badge variant="secondary">Par défaut</Badge>}
                        {isCurrent && <Badge variant="outline">Contexte actuel</Badge>}
                      </div>
                      <h2 className="mt-4 text-xl font-semibold capitalize">
                        Affectation {assignment.niveau_affectation}
                      </h2>
                    </div>
                    <MapPin className="size-6 text-primary" />
                  </div>

                  <div className="mt-5 space-y-3 text-sm">
                    <p><span className="font-semibold">Rôle :</span> {assignment.roles.map((role) => role.libelle).join(", ") || "Non défini"}</p>
                    <p><span className="font-semibold">Session :</span> {assignment.session?.nom || "Toutes les sessions"}</p>
                    <p><span className="font-semibold">Région :</span> {assignment.region_code || "Non précisée"}</p>
                    <p><span className="font-semibold">Centre :</span> {assignment.centre_id ?? "Non précisé"}</p>
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <CalendarDays className="size-4" />
                      Du {assignment.date_debut} {assignment.date_fin ? `au ${assignment.date_fin}` : "sans date de fin"}
                    </p>
                  </div>

                  <Button
                    className="mt-6 w-full gap-2"
                    disabled={isCurrent}
                    onClick={() => void handleSelect(assignment.id)}
                  >
                    {isCurrent ? <Check className="size-4" /> : <MapPin className="size-4" />}
                    {isCurrent ? "Affectation utilisée" : "Utiliser cette affectation"}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
