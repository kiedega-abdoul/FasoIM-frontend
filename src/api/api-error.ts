import axios from "axios"

export function getApiErrorMessage(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return "Une erreur inattendue est survenue."
  }

  const data = error.response?.data

  if (typeof data === "string" && data.trim()) {
    return data
  }

  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>

    if (typeof record.detail === "string") {
      return record.detail
    }

    const firstValue = Object.values(record)[0]
    if (Array.isArray(firstValue) && typeof firstValue[0] === "string") {
      return firstValue[0]
    }

    if (typeof firstValue === "string") {
      return firstValue
    }
  }

  if (!error.response) {
    return "Impossible de joindre le serveur FasoIM."
  }

  return "La requête n’a pas pu être traitée."
}
