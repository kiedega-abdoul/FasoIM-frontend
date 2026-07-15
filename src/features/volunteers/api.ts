import { httpClient } from "@/api/http-client"
import type {
  VolunteerApplicationCreated,
  VolunteerApplicationPayload,
  VolunteerFollowUp,
} from "./types"

export const volunteersApi = {
  async submitApplication(data: VolunteerApplicationPayload) {
    return (
      await httpClient.post<VolunteerApplicationCreated>(
        "/immerges/public/volontaires/demandes/",
        data,
      )
    ).data
  },
  async followApplication(code_suivi: string) {
    return (
      await httpClient.post<VolunteerFollowUp>(
        "/immerges/public/volontaires/suivi/",
        { code_suivi },
      )
    ).data
  },
}
