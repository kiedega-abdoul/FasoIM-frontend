import axios from "axios"

const GENERIC_ERROR_MESSAGE = "L’opération n’a pas pu aboutir. Vérifiez les informations saisies puis réessayez."

function userFacingMessage(value: unknown) {
  if (typeof value !== "string") return null

  const message = value.trim()
  if (!message) return null

  if (/permission absente|hors périmètre|permission denied|forbidden/i.test(message)) {
    return "Vous n’êtes pas autorisé à effectuer cette action dans votre affectation actuelle."
  }

  if (/authentication credentials|token.*(invalid|expired)|not authenticated/i.test(message)) {
    return "Votre session a expiré. Reconnectez-vous pour continuer."
  }

  if (/^not found\.?$/i.test(message)) {
    return "L’information demandée est introuvable."
  }

  const isTechnical =
    /^[<{[]/.test(message)
    || /<!doctype|<html|traceback|exception|request method|request url|django|csrf|nameerror|typeerror|valueerror|attributeerror|keyerror|syntaxerror|integrityerror|databaseerror|internal server error|bad request|method not allowed|service unavailable|stack trace/i.test(message)

  return isTechnical ? null : message
}

export function getApiErrorMessage(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return "Une erreur inattendue est survenue."
  }

  const data = error.response?.data

  if (typeof data === "string") {
    return userFacingMessage(data) ?? GENERIC_ERROR_MESSAGE
  }

  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>

    const detail = userFacingMessage(record.detail)
    if (detail) {
      return detail
    }

    const firstValue = Object.values(record)[0]
    if (Array.isArray(firstValue)) {
      const message = userFacingMessage(firstValue[0])
      if (message) return message
    }

    const message = userFacingMessage(firstValue)
    if (message) return message
  }

  if (!error.response) {
    return "FasoIM est momentanément indisponible. Réessayez dans quelques instants."
  }

  return GENERIC_ERROR_MESSAGE
}
