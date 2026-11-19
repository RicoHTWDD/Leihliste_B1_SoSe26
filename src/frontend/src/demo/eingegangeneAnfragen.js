import { ApiError } from '../utils/api.js'

// Fiktive Anfragen an ein Medienlabor. Neueste Eingänge stehen zuerst.
const personen = ['Hanna Winter', 'Leo Fischer', 'Mira Roth', 'Tarek Sommer', 'Lina Weber', 'Kai Adler', 'Emma Berg']
const gegenstaende = ['Beamer', 'Kamera', 'Stativ', 'Laptop', 'Mikrofon']
const statuswerte = [
  ['eingereicht', 'Eingereicht'],
  ['abgelehnt', 'Abgelehnt'],
  ['genehmigt', 'Genehmigt'],
]

const anfragen = Array.from({ length: 21 }, (_, index) => {
  const id = 21 - index
  const tag = String(id).padStart(2, '0')
  const person = (id - 1) % personen.length
  const gegenstand = (id - 1) % gegenstaende.length
  const [status, anzeige] = statuswerte[id % statuswerte.length]
  const eingang = `2026-10-${tag}T10:00:00Z`
  return {
    id,
    nutzer: person + 1,
    nutzer_name: personen[person],
    nutzer_email: `demo-${person + 1}@example.org`,
    gegenstand: gegenstand + 1,
    gegenstand_name: gegenstaende[gegenstand],
    organisation: 1,
    organisation_name: 'Medienlabor',
    startdatum: `2026-11-${tag}`,
    enddatum: `2026-11-${String(id + 3).padStart(2, '0')}`,
    anfragestatus: status,
    anfragestatus_display: anzeige,
    ablehnungsgrund: status === 'abgelehnt' && id % 2 === 1 ? 'Für diesen Zeitraum bereits vergeben.' : '',
    bedingungen_akzeptiert: true,
    erstellt_am: eingang,
    aktualisiert_am: eingang,
  }
})

// Entscheidungen gelten nur für diesen Demo-Tab und überleben ein Neuladen.
function speicherschluessel(id) {
  return `leihliste.demo.eingang.v1.${id}`
}

function mitEntscheidung(anfrage) {
  if (anfrage.anfragestatus !== 'eingereicht') return anfrage
  let entscheidung
  try {
    entscheidung = JSON.parse(window.sessionStorage.getItem(speicherschluessel(anfrage.id)))
  } catch {
    return anfrage
  }
  const status = entscheidung?.status
  if (status !== 'genehmigt' && status !== 'abgelehnt') return anfrage
  return {
    ...anfrage,
    anfragestatus: status,
    anfragestatus_display: status === 'genehmigt' ? 'Genehmigt' : 'Abgelehnt',
    ablehnungsgrund: status === 'abgelehnt' ? entscheidung.grund : '',
    aktualisiert_am: entscheidung.zeitpunkt,
  }
}

export function demoSeite(seite, seitengroesse = 20) {
  const start = (seite - 1) * seitengroesse
  return { count: anfragen.length, results: anfragen.slice(start, start + seitengroesse).map(mitEntscheidung) }
}

export function demoAnzahl(status) {
  return anfragen.filter(anfrage => mitEntscheidung(anfrage).anfragestatus === status).length
}

export function demoDetail(id) {
  const anfrage = anfragen.find(eintrag => eintrag.id === Number(id))
  if (!anfrage) throw new ApiError('Diese Anfrage wurde nicht gefunden.', 404)
  return mitEntscheidung(anfrage)
}

export function demoEntscheiden(id, entscheidung, grund = '') {
  const anfrage = demoDetail(id)
  if (anfrage.anfragestatus !== 'eingereicht') {
    throw new ApiError('Diese Anfrage wurde bereits bearbeitet.', 409)
  }
  if (entscheidung !== 'genehmigen' && entscheidung !== 'ablehnen') {
    throw new ApiError('Unbekannte Entscheidung.', 400)
  }
  const daten = {
    status: entscheidung === 'genehmigen' ? 'genehmigt' : 'abgelehnt',
    grund: entscheidung === 'ablehnen' ? (grund ?? '').trim() : '',
    zeitpunkt: new Date().toISOString(),
  }
  try {
    window.sessionStorage.setItem(speicherschluessel(anfrage.id), JSON.stringify(daten))
  } catch {
    throw new ApiError('Die Demo-Entscheidung konnte in diesem Browser nicht gespeichert werden.')
  }
  return demoDetail(id)
}
