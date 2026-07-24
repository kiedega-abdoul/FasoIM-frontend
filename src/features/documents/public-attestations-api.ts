import { httpClient } from "@/api/http-client"

export type PublicCertificateConsultation = {
  publication: {
    reference: string
    version: number
    date_publication: string | null
  }
  immerge: {
    nom: string
    prenoms: string
    nom_complet: string
    type_immerge: string
    code_fasoim: string
  }
  session: {
    id: number
    nom: string
    code: string
    annee: number
  }
  affectation: {
    region: string
    centre: string
  }
  code_fasoim: string
  decision: "ELIGIBLE" | "NON_ELIGIBLE" | "A_VERIFIER"
  decision_libelle: string
  attestation_disponible: boolean
  numero_document?: string
  code_verification?: string
  date_publication?: string | null
  url_telechargement?: string
}

export type PublicCertificateVerification = {
  valide: boolean
  statut: string
  integrite?: boolean
  numero_document?: string
  nom_complet?: string
  code_fasoim?: string
  session?: string
  date_delivrance?: string | null
  signataire?: string
  fonction_signataire?: string
}

function normalizeApiPath(path: string) {
  return path.startsWith("/api/") ? path.slice(4) : path
}

export const publicAttestationsApi = {
  async consultByFasoImCode(codeFasoim: string) {
    return (
      await httpClient.post<PublicCertificateConsultation>(
        "/documents/public/attestations/consulter/",
        { code_fasoim: codeFasoim.trim() },
      )
    ).data
  },

  async verify(value: string) {
    const normalizedValue = value.trim()
    const payload = /^ATT-/i.test(normalizedValue)
      ? { numero: normalizedValue }
      : { code: normalizedValue }

    return (
      await httpClient.post<PublicCertificateVerification>(
        "/documents/public/attestations/verifier/",
        payload,
      )
    ).data
  },

  async download(url: string, fallbackName = "attestation-fasoim.pdf") {
    const response = await httpClient.get<Blob>(normalizeApiPath(url), {
      responseType: "blob",
    })
    const disposition = String(response.headers["content-disposition"] ?? "")
    const match = disposition.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i)
    const filename = match ? decodeURIComponent(match[1].replace(/"/g, "")) : fallbackName
    const objectUrl = URL.createObjectURL(response.data)
    const anchor = document.createElement("a")
    anchor.href = objectUrl
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(objectUrl)
  },
}
