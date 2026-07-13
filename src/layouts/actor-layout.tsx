import { Outlet } from "react-router-dom"

import { ActorNavbar } from "@/components/common/actor-navbar"
import { PublicFooter } from "@/components/common/public-footer"

export function ActorLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-foreground">
      <ActorNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  )
}
