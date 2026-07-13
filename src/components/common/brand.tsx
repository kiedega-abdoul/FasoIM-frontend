import { Link } from "react-router-dom"

import logo from "@/assets/im.png"
import { cn } from "@/lib/utils"

type BrandProps = {
  compact?: boolean
  className?: string
}

export function Brand({ compact = false, className }: BrandProps) {
  return (
    <Link
      to="/"
      aria-label="FasoIM, retour à l’accueil"
      className={cn("group flex items-center gap-3", className)}
    >
      <span className="relative flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-primary/15 bg-white p-1 shadow-sm">
        <img
          src={logo}
          alt="Logo FasoIM"
          className="h-full w-full object-contain object-center transition-transform duration-300 group-hover:scale-105"
        />
      </span>

      {!compact && (
        <span className="leading-tight">
          <span className="block text-xl font-bold tracking-tight text-primary">
            FasoIM
          </span>
          <span className="block text-sm font-medium text-muted-foreground">
            Immersion patriotique
          </span>
        </span>
      )}
    </Link>
  )
}
