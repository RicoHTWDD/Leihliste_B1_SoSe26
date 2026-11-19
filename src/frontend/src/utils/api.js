export class ApiError extends Error {
  constructor(message, status = 0, fields = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fields = fields
  }
}

// Alle Aufrufe gehen über denselben Ursprung (lokal über den Vite-Proxy).
export function apiUrl(path) {
  let url
  try {
    url = new URL(path, window.location.origin)
  } catch {
    throw new ApiError('Die API-Adresse ist ungültig.')
  }
  if (url.origin !== window.location.origin || !url.pathname.startsWith('/api/') || url.username || url.password) {
    throw new ApiError('Die API-Adresse ist ungültig.')
  }
  return url
}

function csrfToken() {
  const cookie = document.cookie.split(';').map(part => part.trim())
    .find(part => part.startsWith('csrftoken='))
  return cookie ? decodeURIComponent(cookie.slice('csrftoken='.length)) : ''
}

const statusMeldungen = {
  400: 'Bitte die Eingaben prüfen.',
  401: 'Bitte erneut anmelden.',
  403: 'Für diese Aktion fehlt die Berechtigung.',
  404: 'Der angeforderte Eintrag wurde nicht gefunden.',
  409: 'Die Daten wurden inzwischen geändert. Bitte erneut laden.',
}

function fehlermeldung(daten, status) {
  for (const wert of [daten?.detail, daten?.error, daten?.meldung, daten?.non_field_errors, daten]) {
    const text = Array.isArray(wert) ? wert[0] : wert
    if (typeof text === 'string' && text.trim()) return text
  }
  return statusMeldungen[status] ?? `Anfrage fehlgeschlagen (HTTP ${status}).`
}

export async function apiRequest(path, { method = 'GET', data, signal } = {}) {
  const url = apiUrl(path)
  const headers = { Accept: 'application/json' }
  const options = { method, headers, credentials: 'same-origin', mode: 'same-origin', signal }

  if (!['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())) {
    const token = csrfToken()
    if (token) headers['X-CSRFToken'] = token
  }
  if (data instanceof FormData) {
    options.body = data
  } else if (data !== undefined) {
    headers['Content-Type'] = 'application/json'
    options.body = JSON.stringify(data)
  }

  let response
  let text
  try {
    response = await fetch(url, options)
    if (response.status === 204) return null
    text = await response.text()
  } catch (error) {
    if (signal?.aborted || error.name === 'AbortError') throw error
    throw new ApiError('Der Server ist nicht erreichbar. Bitte die Verbindung prüfen.')
  }

  let result = null
  if (text.trim()) {
    try {
      result = JSON.parse(text)
    } catch {
      if (response.ok) {
        throw new ApiError('Der Server hat keine gültigen JSON-Daten zurückgegeben.', response.status)
      }
    }
  }
  if (!response.ok) {
    const fields = response.status === 400 && result && typeof result === 'object' && !Array.isArray(result)
      ? result : {}
    throw new ApiError(fehlermeldung(result, response.status), response.status, fields)
  }
  return result
}
