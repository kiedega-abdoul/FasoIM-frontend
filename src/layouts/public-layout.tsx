import { Outlet } from "react-router-dom"

import { PublicFooter } from "@/components/common/public-footer"
import { PublicNavbar } from "@/components/common/public-navbar"

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <PublicNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  )
}
