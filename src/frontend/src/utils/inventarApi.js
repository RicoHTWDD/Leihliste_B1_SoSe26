class ApiError extends Error {
  constructor(message, status = 0, fields = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fields = fields
  }
}

function apiUrl(path) {
  const url = new URL(path, window.location.origin)
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
      if (response.ok) throw new ApiError('Der Server hat keine gültigen JSON-Daten zurückgegeben.', response.status)
    }
  }

  if (!response.ok) {
    const fields = response.status === 400 && result && typeof result === 'object' ? result : {}
    const fallback = response.status === 400 ? 'Bitte die Eingaben prüfen.' : `Anfrage fehlgeschlagen (HTTP ${response.status}).`
    const message = result?.meldung || result?.detail || fields.non_field_errors?.[0] || fallback
    throw new ApiError(message, response.status, fields)
  }
  return result
}

// Django kann im next-Link die Adresse des lokalen oder des Docker-Backends
// zurückgeben. Folge dem Seitenparameter über denselben Vite-Proxy.
function nextPage(link, current) {
  const next = new URL(link, current)
  const lokalesBackend = next.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]', 'backend'].includes(next.hostname)
  const knownOrigin = next.origin === window.location.origin || lokalesBackend
  if (!knownOrigin || next.username || next.password || next.pathname !== current.pathname || next.hash) {
    throw new ApiError('Der Server hat einen ungültigen Link zur nächsten Seite geliefert.')
  }
  const local = new URL(current)
  local.search = next.search
  return local
}

export async function listAll(path, { signal } = {}) {
  const items = []
  const visited = new Set()
  let url = apiUrl(path)
  while (url) {
    if (visited.has(url.href)) throw new ApiError('Die Seiten der Liste verweisen im Kreis aufeinander.')
    visited.add(url.href)
    const page = await apiRequest(url, { signal })
    if (Array.isArray(page)) return items.concat(page)
    if (!Array.isArray(page?.results)) throw new ApiError('Der Server hat keine gültige Liste zurückgegeben.')
    items.push(...page.results)
    url = page.next ? nextPage(page.next, url) : null
  }
  return items
}
