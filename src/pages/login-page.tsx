import { LockKeyhole, LogIn, Mail } from "lucide-react"

import { Brand } from "@/components/common/brand"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function LoginPage() {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-12rem)] max-w-7xl items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <Card className="w-full max-w-xl shadow-2xl shadow-primary/8">
        <CardHeader className="items-center px-8 pt-8 text-center sm:px-10 sm:pt-10">
          <Brand className="mb-6" />
          <CardTitle className="text-3xl">Connexion sécurisée</CardTitle>
          <CardDescription className="text-base">
            Accédez à votre espace acteur FasoIM.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-8 pb-8 sm:px-10 sm:pb-10">
          <form className="space-y-6" onSubmit={(event) => event.preventDefault()}>
            <div className="space-y-2.5">
              <Label htmlFor="email" className="text-base">
                Adresse e-mail
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  className="h-12 pl-12 text-base"
                  placeholder="nom@organisation.bf"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="password" className="text-base">
                Mot de passe
              </Label>
              <div className="relative">
                <LockKeyhole className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  className="h-12 pl-12 text-base"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <Button type="submit" className="h-12 w-full gap-2 text-base">
              <LogIn className="size-5" />
              Se connecter
            </Button>

            <p className="text-center text-sm leading-6 text-muted-foreground">
              L’authentification réelle sera branchée au backend dans le prochain patch.
            </p>
          </form>
        </CardContent>
      </Card>
    </section>
  )
}
