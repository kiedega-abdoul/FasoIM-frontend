import { Navigate, Route, Routes } from "react-router-dom"

import { ActorLayout } from "@/layouts/actor-layout"
import { AppLayout } from "@/layouts/app-layout"
import { PublicLayout } from "@/layouts/public-layout"
import { ActorHomePage } from "@/pages/actor-home-page"
import { AssignmentsPage } from "@/pages/assignments-page"
import { ConsultationPage } from "@/pages/consultation-page"
import { DashboardPage } from "@/pages/dashboard-page"
import { VolunteerApplicationPage } from "@/pages/volunteer-application-page"
import { VolunteerChoicePage } from "@/pages/volunteer-choice-page"
import { VolunteerFollowUpPage } from "@/pages/volunteer-follow-up-page"
import { HomePage } from "@/pages/home-page"
import { LoginPage } from "@/pages/login-page"
import { NotFoundPage } from "@/pages/not-found-page"
import { IncidentsPage } from "@/pages/incidents-page"
import { VerificationAttestationPage } from "@/pages/verification-attestation-page"
import { ProtectedRoute } from "@/routes/protected-route"
import { PermissionRoute } from "@/routes/permission-route"
import { ACCOUNT_PERMISSIONS as AP } from "@/features/accounts/permissions"
import { ACCOUNT_GROUPS } from "@/features/accounts/groups"
import { SESSION_GROUPS } from "@/features/sessions/groups"
import { SESSION_PERMISSIONS as SP } from "@/features/sessions/permissions"
import { SessionsListPage } from "@/features/sessions/pages/sessions-list-page"
import { SessionFormPage } from "@/features/sessions/pages/session-form-page"
import { SessionParametersPage } from "@/features/sessions/pages/session-parameters-page"
import { SessionDetailPage } from "@/features/sessions/pages/session-detail-page"
import { IMPORT_GROUPS } from "@/features/imports/groups"
import { IMPORT_PERMISSIONS as IP } from "@/features/imports/permissions"
import { ImportsListPage } from "@/features/imports/pages/imports-list-page"
import { ImportCreatePage } from "@/features/imports/pages/import-create-page"
import { ImportDetailPage } from "@/features/imports/pages/import-detail-page"
import { ImportMappingPage } from "@/features/imports/pages/import-mapping-page"
import { ImportRowsPage } from "@/features/imports/pages/import-rows-page"
import { ImportErrorsPage } from "@/features/imports/pages/import-errors-page"
import { AFFECTATION_GROUPS } from "@/features/affectations/groups"
import { AFFECTATION_PERMISSIONS as AFP } from "@/features/affectations/permissions"
import { CenterFormPage, CentersPage, RegionFormPage, RegionsPage } from "@/features/affectations/pages/referentials-pages"
import { RegionalAssignmentsPage } from "@/features/affectations/pages/regional-assignments-page"
import { CenterAssignmentsPage } from "@/features/affectations/pages/center-assignments-page"
import { MyCenterPage } from "@/features/affectations/pages/my-center-page"
import { KITS_GROUPS } from "@/features/kits/groups"
import { KITS_PERMISSIONS as KP } from "@/features/kits/permissions"
import { KitArticleFormPage, KitsPage } from "@/features/kits/pages/kits-pages"
import { KitDistributionPage } from "@/features/kits/pages/kit-distribution-page"
import { ORGANISATION_GROUPS } from "@/features/organisation/groups"
import { ORGANISATION_PERMISSIONS as OP } from "@/features/organisation/permissions"
import { BedFormPage, BedsPage, DormitoriesPage, DormitoryDetailPage, DormitoryFormPage } from "@/features/organisation/pages/hebergement-pages"
import { CenterOrganizationPage } from "@/features/organisation/pages/center-organization-page"
import { InternalDistributionPage } from "@/features/organisation/pages/internal-distribution-page"
import { CenterFinalizationPage } from "@/features/organisation/pages/center-finalization-page"
import { ProfilePage, EditProfilePage, ChangePasswordPage } from "@/features/accounts/pages/profile-pages"
import { ActorsListPage, ActorFormPage, ActorDetailPage } from "@/features/accounts/pages/actors-pages"
import { AssignmentsListPage, AssignmentCreatePage, AssignmentDetailPage, RolesListPage, RoleFormPage, RoleDetailPage, RolePermissionsPage, PermissionsListPage, PermissionDetailPage } from "@/features/accounts/pages/access-pages"
import { PermissionRequestsListPage, PermissionRequestCreatePage, PermissionRequestDetailPage } from "@/features/accounts/pages/requests-pages"
import { VolunteerRequestDetailPage, VolunteerRequestsListPage } from "@/features/volunteers/requests-pages"
import { VOLUNTEER_REQUEST_ACCESS, VOLUNTEER_REQUEST_PERMISSIONS as VRP } from "@/features/volunteers/requests-permissions"
import { ACTIVITES_ACCESS } from "@/features/activites/permissions"
import { AdministrationActivitiesPage } from "@/features/activites/pages/administration-activities-page"
import { ImmergesListPage } from "@/features/immerges/pages/immerges-list-page"
import { CenterImmergesPage } from "@/features/immerges/pages/center-immerges-page"
import { IMMERGE_PERMISSIONS } from "@/features/immerges/permissions"


export function AppRouter() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="consultation" element={<ConsultationPage />} />
        <Route path="demande-volontaire" element={<VolunteerChoicePage />} />
        <Route path="demande-volontaire/nouvelle" element={<VolunteerApplicationPage />} />
        <Route path="demande-volontaire/suivi" element={<VolunteerFollowUpPage />} />
        <Route path="verification-attestation" element={<VerificationAttestationPage />} />
        <Route path="connexion" element={<Navigate to="/espace-acteur/connexion" replace />} />
      </Route>

      <Route path="espace-acteur" element={<ActorLayout />}>
        <Route index element={<ActorHomePage />} />
        <Route path="consultation" element={<ConsultationPage />} />
        <Route path="verification-attestation" element={<VerificationAttestationPage />} />
        <Route path="connexion" element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="app" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="mes-affectations" element={<AssignmentsPage />} />
          <Route path="consultation" element={<ConsultationPage />} />
          <Route path="verification-attestation" element={<VerificationAttestationPage />} />
          <Route path="profil" element={<ProfilePage />} />
          <Route path="incidents" element={<IncidentsPage />} />
          <Route path="profil/modifier" element={<EditProfilePage />} />
          <Route path="profil/mot-de-passe" element={<ChangePasswordPage />} />

          <Route element={<PermissionRoute permissions={[...VOLUNTEER_REQUEST_ACCESS]} />}><Route path="demandes-volontaires" element={<VolunteerRequestsListPage />} /></Route>
          <Route element={<PermissionRoute permission={VRP.VIEW} />}><Route path="demandes-volontaires/:id" element={<VolunteerRequestDetailPage />} /></Route>

          <Route element={<PermissionRoute permissions={[...SESSION_GROUPS.MANAGEMENT]} />}><Route path="sessions" element={<SessionsListPage />} /></Route>
          <Route element={<PermissionRoute permission={SP.CREATE} />}><Route path="sessions/nouvelle" element={<SessionFormPage />} /></Route>
          <Route element={<PermissionRoute permission={SP.VIEW} />}><Route path="sessions/:sessionId" element={<SessionDetailPage />} /></Route>
          <Route element={<PermissionRoute permission={SP.UPDATE} />}><Route path="sessions/:sessionId/modifier" element={<SessionFormPage edit />} /></Route>
          <Route element={<PermissionRoute permission={SP.CONFIGURE} />}><Route path="sessions/:sessionId/parametres/configurer" element={<SessionParametersPage configure />} /></Route>
          <Route element={<PermissionRoute permission={SP.UPDATE_SETTINGS} />}><Route path="sessions/:sessionId/parametres/modifier" element={<SessionParametersPage />} /></Route>

          <Route element={<PermissionRoute permissions={[...IMPORT_GROUPS.MANAGEMENT]} />}><Route path="imports" element={<ImportsListPage />} /></Route>
          <Route element={<PermissionRoute permission={IP.CREATE} />}><Route path="imports/nouveau" element={<ImportCreatePage />} /></Route>
          <Route element={<PermissionRoute permission={IP.VIEW} />}><Route path="imports/:id" element={<ImportDetailPage />} /></Route>
          <Route element={<PermissionRoute permission={IP.VALIDATE_MAPPING} />}><Route path="imports/:id/correspondance" element={<ImportMappingPage />} /></Route>
          <Route element={<PermissionRoute permission={IP.VIEW_ROWS} />}><Route path="imports/:id/lignes" element={<ImportRowsPage />} /></Route>
          <Route element={<PermissionRoute permission={IP.VIEW_ERRORS} />}><Route path="imports/:id/erreurs" element={<ImportErrorsPage />} /></Route>

          <Route element={<PermissionRoute permissions={[...AFFECTATION_GROUPS.REGIONS]} />}><Route path="regions" element={<RegionsPage />} /></Route>
          <Route element={<PermissionRoute permission={AFP.CREATE_REGION} />}><Route path="regions/nouvelle" element={<RegionFormPage />} /></Route>
          <Route element={<PermissionRoute permission={AFP.UPDATE_REGION} />}><Route path="regions/:id/modifier" element={<RegionFormPage edit />} /></Route>
          <Route element={<PermissionRoute permissions={[...AFFECTATION_GROUPS.CENTERS]} />}><Route path="centres" element={<CentersPage />} /></Route>
          <Route element={<PermissionRoute permissions={[...AFFECTATION_GROUPS.CENTERS]} />}><Route path="mon-centre" element={<MyCenterPage />} /></Route>
          <Route element={<PermissionRoute permission={AFP.CREATE_CENTER} />}><Route path="centres/nouveau" element={<CenterFormPage />} /></Route>
          <Route element={<PermissionRoute permission={AFP.UPDATE_CENTER} />}><Route path="centres/:id/modifier" element={<CenterFormPage edit />} /></Route>
          <Route element={<PermissionRoute permissions={[...AFFECTATION_GROUPS.REGIONAL_ASSIGNMENTS]} />}><Route path="affectations-regionales" element={<RegionalAssignmentsPage />} /></Route>
          <Route element={<PermissionRoute permissions={[...AFFECTATION_GROUPS.CENTER_ASSIGNMENTS]} />}><Route path="affectations-centres" element={<CenterAssignmentsPage />} /></Route>
          <Route element={<PermissionRoute permission={IMMERGE_PERMISSIONS.LIST} />}><Route path="immerges" element={<ImmergesListPage />} /><Route path="immerges-centre" element={<CenterImmergesPage />} /></Route>

          <Route element={<PermissionRoute permissions={[...ORGANISATION_GROUPS.DORMITORIES]} />}><Route path="dortoirs" element={<DormitoriesPage />} /></Route>
          <Route element={<PermissionRoute permission={OP.VIEW_HOSTING} />}><Route path="dortoirs/:id" element={<DormitoryDetailPage />} /></Route>
          <Route element={<PermissionRoute permission={OP.CREATE_DORMITORY} />}><Route path="dortoirs/nouveau" element={<DormitoryFormPage />} /></Route>
          <Route element={<PermissionRoute permission={OP.UPDATE_DORMITORY} />}><Route path="dortoirs/:id/modifier" element={<DormitoryFormPage edit />} /></Route>
          <Route element={<PermissionRoute permissions={[...ORGANISATION_GROUPS.BEDS]} />}><Route path="lits" element={<BedsPage />} /></Route>
          <Route element={<PermissionRoute permission={OP.CREATE_BED} />}><Route path="lits/nouveau" element={<BedFormPage />} /></Route>
          <Route element={<PermissionRoute permission={OP.UPDATE_BED} />}><Route path="lits/:id/modifier" element={<BedFormPage edit />} /></Route>
          <Route element={<PermissionRoute permissions={[...ORGANISATION_GROUPS.CENTER_ORGANIZATION]} />}><Route path="organisation-centre" element={<CenterOrganizationPage />} /></Route>
          <Route element={<PermissionRoute permissions={[...ORGANISATION_GROUPS.INTERNAL_DISTRIBUTION]} />}><Route path="repartition-interne" element={<InternalDistributionPage />} /></Route>
          <Route element={<PermissionRoute permission={OP.VIEW_CENTER_RULES} />}><Route path="finalisation-centre" element={<CenterFinalizationPage />} /></Route>

          <Route element={<PermissionRoute permissions={[...ACTIVITES_ACCESS]} />}><Route path="activites" element={<AdministrationActivitiesPage />} /></Route>

          <Route element={<PermissionRoute permissions={[...KITS_GROUPS.ACCESS]} />}><Route path="kits" element={<KitsPage />} /></Route>
          <Route element={<PermissionRoute permission={KP.CREATE_BRING_ARTICLE} />}><Route path="kits/articles/nouveau-a-apporter" element={<KitArticleFormPage type="A_APPORTER" />} /></Route>
          <Route element={<PermissionRoute permission={KP.CREATE_GIVE_ARTICLE} />}><Route path="kits/articles/nouveau-a-remettre" element={<KitArticleFormPage type="A_REMETTRE" />} /></Route>
          <Route element={<PermissionRoute permission={KP.UPDATE_ARTICLE} />}><Route path="kits/articles/:id/modifier" element={<KitArticleFormPage edit />} /></Route>
          <Route element={<PermissionRoute permission={KP.VALIDATE_MASS} />}><Route path="kits/articles/:id/distribution" element={<KitDistributionPage />} /></Route>

          <Route element={<PermissionRoute permissions={[...ACCOUNT_GROUPS.ACTORS]} />}><Route path="acteurs" element={<ActorsListPage />} /></Route>
          <Route element={<PermissionRoute permission={AP.CREATE_ACTOR} />}><Route path="acteurs/nouveau" element={<ActorFormPage />} /></Route>
          <Route element={<PermissionRoute permission={AP.VIEW_ACTOR} />}><Route path="acteurs/:acteurId" element={<ActorDetailPage />} /></Route>
          <Route element={<PermissionRoute permission={AP.UPDATE_ACTOR} />}><Route path="acteurs/:acteurId/modifier" element={<ActorFormPage edit />} /></Route>

          <Route element={<PermissionRoute permissions={[...ACCOUNT_GROUPS.ASSIGNMENTS]} />}><Route path="affectations" element={<AssignmentsListPage />} /></Route>
          <Route element={<PermissionRoute permission={AP.ASSIGN_ACTOR} />}><Route path="affectations/nouvelle" element={<AssignmentCreatePage />} /></Route>
          <Route element={<PermissionRoute permissions={[...ACCOUNT_GROUPS.ASSIGNMENTS]} />}><Route path="affectations/:id" element={<AssignmentDetailPage />} /></Route>

          <Route element={<PermissionRoute permissions={[...ACCOUNT_GROUPS.ROLES]} />}><Route path="roles" element={<RolesListPage />} /></Route>
          <Route element={<PermissionRoute permission={AP.CREATE_ROLE} />}><Route path="roles/nouveau" element={<RoleFormPage />} /></Route>
          <Route element={<PermissionRoute permission={AP.VIEW_ROLE} />}><Route path="roles/:roleId" element={<RoleDetailPage />} /><Route path="roles/:roleId/permissions" element={<RolePermissionsPage />} /></Route>
          <Route element={<PermissionRoute permission={AP.UPDATE_ROLE} />}><Route path="roles/:roleId/modifier" element={<RoleFormPage edit />} /></Route>

          <Route element={<PermissionRoute permissions={[...ACCOUNT_GROUPS.PERMISSIONS]} />}><Route path="permissions" element={<PermissionsListPage />} /></Route>
          <Route element={<PermissionRoute permission={AP.VIEW_PERMISSION} />}><Route path="permissions/:permissionId" element={<PermissionDetailPage />} /></Route>
          <Route element={<PermissionRoute permissions={[...ACCOUNT_GROUPS.REQUESTS]} />}><Route path="permissions/demandes" element={<PermissionRequestsListPage />} /></Route>
          <Route element={<PermissionRoute permission={AP.REQUEST_PERMISSION} />}><Route path="permissions/demandes/nouvelle" element={<PermissionRequestCreatePage />} /></Route>
          <Route element={<PermissionRoute permission={AP.VIEW_PERMISSION_REQUEST} />}><Route path="permissions/demandes/:id" element={<PermissionRequestDetailPage />} /></Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
