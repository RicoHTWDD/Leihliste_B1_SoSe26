import { apiRequest, apiUrl } from './api.js'

export const SEITENGROESSE = 20
export const istAnfragenDemo = import.meta.env.DEV && import.meta.env.VITE_ANFRAGEN_DEMO === 'true'
const listeUrl = import.meta.env.VITE_EINGANG_LISTE_URL || '/api/lending/eingang/'
const detailVorlage = import.meta.env.VITE_EINGANG_DETAIL_URL || '/api/lending/eingang/{id}/'

export async function ladeEingangsrecht(vorgegeben, { signal } = {}) {
  if (typeof vorgegeben === 'boolean') return vorgegeben
  if (istAnfragenDemo) {
    return (import.meta.env.VITE_ANFRAGEN_DEMOROLLE ?? 'verleiher') === 'verleiher'
  }
  try {
    const nutzer = await apiRequest('/api/users/ich/', { signal })
    return (nutzer?.benutzerrolle ?? nutzer?.rolle) === 'verleiher'
  } catch (fehler) {
    if (fehler.status === 401 || fehler.status === 403) return false
    throw fehler
  }
}

export async function ladeAnzahlAnfragen(status, { signal } = {}) {
  if (istAnfragenDemo) {
    const { demoAnzahl } = await import('../demo/eingegangeneAnfragen.js')
    signal?.throwIfAborted()
    return demoAnzahl(status)
  }
  const url = apiUrl(listeUrl)
  url.searchParams.set('anfragestatus', status)
  const daten = await apiRequest(url, { signal })
  if (!Number.isSafeInteger(daten?.count) || daten.count < 0) {
    throw new Error('Die API hat keine gültige Anzahl geliefert.')
  }
  return daten.count
}

function konfigurationPruefen() {
  if (!listeUrl || !detailVorlage?.includes('{id}')) {
    throw new Error('Die API für eingegangene Anfragen ist noch nicht konfiguriert.')
  }
}

export async function ladeEingegangeneSeite(seite, { signal } = {}) {
  if (!Number.isSafeInteger(seite) || seite < 1) throw new Error('Ungültige Seitennummer.')
  if (istAnfragenDemo) {
    const { demoSeite } = await import('../demo/eingegangeneAnfragen.js')
    signal?.throwIfAborted()
    return demoSeite(seite, SEITENGROESSE)
  }

  konfigurationPruefen()
  const url = apiUrl(listeUrl)
  url.searchParams.set('page', String(seite))
  const daten = await apiRequest(url, { signal })
  if (!Number.isSafeInteger(daten?.count) || daten.count < 0 || !Array.isArray(daten.results)
      || daten.results.length > SEITENGROESSE || daten.results.some(eintrag => eintrag?.id == null)) {
    throw new Error('Die API hat keine gültige Seite mit Ausleihanfragen geliefert.')
  }
  return { count: daten.count, results: daten.results }
}

export async function ladeEingegangeneAnfrage(id, { signal } = {}) {
  if (!/^\d+$/.test(String(id)) || Number(id) < 1) throw new Error('Ungültige Anfrage-ID.')
  if (istAnfragenDemo) {
    const { demoDetail } = await import('../demo/eingegangeneAnfragen.js')
    signal?.throwIfAborted()
    return demoDetail(id)
  }

  konfigurationPruefen()
  const url = detailVorlage.replace('{id}', encodeURIComponent(id))
  const daten = await apiRequest(url, { signal })
  if (String(daten?.id) !== String(id)) {
    throw new Error('Die API hat keine gültigen Details zu dieser Anfrage geliefert.')
  }
  return daten
}

export async function entscheideAnfrage(id, aktion, grund = '') {
  if (!/^\d+$/.test(String(id)) || Number(id) < 1) throw new Error('Ungültige Anfrage-ID.')
  if (aktion !== 'genehmigen' && aktion !== 'ablehnen') throw new Error('Unbekannte Entscheidung.')
  const ablehnungsgrund = aktion === 'ablehnen' ? grund.trim() : ''

  if (istAnfragenDemo) {
    const { demoEntscheiden } = await import('../demo/eingegangeneAnfragen.js')
    return demoEntscheiden(id, aktion, ablehnungsgrund)
  }

  konfigurationPruefen()
  const url = apiUrl(detailVorlage.replace('{id}', encodeURIComponent(id)))
  url.pathname = url.pathname.replace(/\/?$/, '/') + aktion + '/'
  return apiRequest(url, { method: 'POST', data: ablehnungsgrund ? { ablehnungsgrund } : {} })
}
