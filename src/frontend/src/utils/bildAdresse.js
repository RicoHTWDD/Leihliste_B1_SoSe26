// DRF kann dieselbe Mediendatei als Pfad oder als URL des lokalen Django-Servers liefern.
export function bildAdresse(wert) {
  if (typeof wert !== 'string' || !wert.trim()) return null
  try {
    const url = new URL(wert.trim(), window.location.origin)
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null

    const lokal = ['localhost', '127.0.0.1', '[::1]', 'backend'].includes(url.hostname)
    if (url.pathname.startsWith('/media/') && (lokal || url.origin === window.location.origin)) {
      return url.pathname + url.search + url.hash
    }
    // Ein Medienserver kann auch eine eigene öffentliche HTTPS-Adresse verwenden.
    return /^https?:\/\//i.test(wert.trim()) ? url.href : null
  } catch {
    return null
  }
}
