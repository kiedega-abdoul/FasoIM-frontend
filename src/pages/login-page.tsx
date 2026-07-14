import { zodResolver } from "@hookform/resolvers/zod"
import { LockKeyhole, LogIn, UserRound } from "lucide-react"
import { useForm } from "react-hook-form"
import { useLocation, useNavigate } from "react-router-dom"
import { toast } from "sonner"

import logo from "@/assets/im.png"
import { getApiErrorMessage } from "@/api/api-error"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { loginSchema, type LoginFormValues } from "@/schemas/auth-schema"
import { useAuthStore } from "@/stores/auth-store"

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((state) => state.login)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  })

  async function onSubmit(values: LoginFormValues) {
    try {
      await login(values.username, values.password)
      const from = (location.state as { from?: string } | null)?.from
      navigate(from?.startsWith("/app") ? from : "/app", { replace: true })
      toast.success("Connexion réussie.")
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  return (
    <section className="min-h-[calc(100vh-6rem)] bg-muted/30">
      <div className="mx-auto grid min-h-[calc(100vh-6rem)] max-w-7xl lg:grid-cols-2">
        <div className="flex items-center justify-center px-4 py-14 sm:px-8 lg:px-12">
          <Card className="w-full max-w-xl border-border/70 bg-card shadow-2xl shadow-primary/8">
            <CardHeader className="px-8 pt-8 sm:px-10 sm:pt-10">
              <CardTitle className="text-3xl sm:text-4xl">Connexion sécurisée</CardTitle>
              <CardDescription className="text-base leading-7">
                Accédez à votre espace acteur FasoIM.
              </CardDescription>
            </CardHeader>

            <CardContent className="px-8 pb-8 sm:px-10 sm:pb-10">
              <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-2.5">
                  <Label htmlFor="username" className="text-base">Identifiant</Label>
                  <div className="relative">
                    <UserRound className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="username"
                      className="h-13 pl-12 text-base"
                      placeholder="Votre identifiant FasoIM"
                      autoComplete="username"
                      aria-invalid={Boolean(errors.username)}
                      {...register("username")}
                    />
                  </div>
                  {errors.username && <p className="text-sm text-destructive">{errors.username.message}</p>}
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="password" className="text-base">Mot de passe</Label>
                  <div className="relative">
                    <LockKeyhole className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      className="h-13 pl-12 text-base"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      aria-invalid={Boolean(errors.password)}
                      {...register("password")}
                    />
                  </div>
                  {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
                </div>

                <Button type="submit" className="h-13 w-full gap-2 text-base" disabled={isSubmitting}>
                  <LogIn className="size-5" />
                  {isSubmitting ? "Connexion en cours…" : "Se connecter"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="relative hidden min-h-full items-center justify-center overflow-hidden border-l bg-primary/5 px-10 py-16 lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--fasoim-green-soft),transparent_68%)]" />
          <img src={logo} alt="FasoIM, Immersion patriotique" className="relative z-10 w-full max-w-xl object-contain" />
        </div>
      </div>
    </section>
  )
}
