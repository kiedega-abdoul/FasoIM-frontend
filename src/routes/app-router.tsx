import { Navigate, Route, Routes } from "react-router-dom"

import { ActorLayout } from "@/layouts/actor-layout"
import { PublicLayout } from "@/layouts/public-layout"
import { ActorHomePage } from "@/pages/actor-home-page"
import { ConsultationPage } from "@/pages/consultation-page"
import { VolunteerApplicationPage } from "@/pages/volunteer-application-page"
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
        <Route path="demande-volontaire" element={<VolunteerApplicationPage />} />
        <Route path="verification-attestation" element={<VerificationAttestationPage />} />
        <Route path="connexion" element={<Navigate to="/espace-acteur/connexion" replace />} />
      </Route>

      <Route path="espace-acteur" element={<ActorLayout />}>
        <Route index element={<ActorHomePage />} />
        <Route path="consultation" element={<ConsultationPage />} />
        <Route path="verification-attestation" element={<VerificationAttestationPage />} />
        <Route path="connexion" element={<LoginPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
