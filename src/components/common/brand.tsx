import { Link, useLocation } from "react-router-dom"

import logo from "@/assets/im.png"
import { cn } from "@/lib/utils"

type BrandProps = {
  compact?: boolean
  className?: string
}

export function Brand({ compact = false, className }: BrandProps) {
  const location = useLocation()
  const homePath = location.pathname.startsWith("/app")
    ? "/app"
    : location.pathname.startsWith("/espace-acteur")
      ? "/espace-acteur"
      : "/"

  return (
    <Link
      to={homePath}
      aria-label="FasoIM, retour à l’accueil"
      className={cn("group inline-flex shrink-0 items-center", className)}
    >
      <span
        className={cn(
          "relative flex shrink-0 items-center justify-center overflow-hidden",
          compact ? "h-13 w-48" : "h-16 w-60 sm:h-17 sm:w-64",
        )}
      >
        <img
          src={logo}
          alt="FasoIM, Immersion patriotique"
          className="block h-full w-full object-contain object-center transition-transform duration-300 group-hover:scale-[1.02]"
        />
      </span>
    </Link>
  )
}
