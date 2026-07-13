import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import App from "@/App"
import { AppProviders } from "@/app/providers"
import "@/index.css"

const rootElement = document.getElementById("root")

if (!rootElement) {
  throw new Error("L’élément racine #root est introuvable.")
}

createRoot(rootElement).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
)
