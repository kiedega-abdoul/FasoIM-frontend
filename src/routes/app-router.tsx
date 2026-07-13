import { Route, Routes } from "react-router-dom"

import { PublicLayout } from "@/layouts/public-layout"
import { ConsultationPage } from "@/pages/consultation-page"
import { HomePage } from "@/pages/home-page"
import { LoginPage } from "@/pages/login-page"
import { NotFoundPage } from "@/pages/not-found-page"
import { VerificationAttestationPage } from "@/pages/verification-attestation-page"

export function AppRouter() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="consultation" element={<ConsultationPage />} />
        <Route path="verification-attestation" element={<VerificationAttestationPage />} />
        <Route path="connexion" element={<LoginPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
