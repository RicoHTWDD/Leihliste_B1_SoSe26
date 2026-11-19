// Lokale Demo für #47. Änderungen bleiben bis zum Ende dieses Prozesses erhalten.
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { join } from 'node:path'
import { parseArgs } from 'node:util'

const { values } = parseArgs({ options: { ausleiher: { type: 'boolean' }, import: { type: 'string' } } })
const erlaubt = !values.ausleiher
const beispiele = {
  kategorien: [{ id: 1, name: 'Veranstaltungstechnik', beschreibung: 'Geräte für Vorträge und Seminare' }],
  standorte: [{ id: 1, name: 'Medienraum', beschreibung: 'Erdgeschoss, Raum 012' }],
}

async function ladeStartdaten(art) {
  const datei = values.import && join(values.import, art + '.json')
  const zeilen = datei ? JSON.parse(await readFile(datei, 'utf8')) : beispiele[art]
  const eintraege = new Map()
  if (!Array.isArray(zeilen)) throw new Error(datei + ' muss ein JSON-Array enthalten.')
  let naechsteId = 1
  for (const { id, name, beschreibung } of zeilen) {
    if (!Number.isSafeInteger(id) || id < 1 || id >= Number.MAX_SAFE_INTEGER ||
        eintraege.has(id) || typeof name !== 'string' || typeof beschreibung !== 'string') {
      throw new Error('Ungültiger Eintrag in ' + datei)
    }
    eintraege.set(id, { id, name, beschreibung, archiviert: false })
    naechsteId = Math.max(naechsteId, id + 1)
  }
  if (!eintraege.has(1)) throw new Error(art + ': Der Eintrag mit ID 1 wird für das Demo-Inventar benötigt.')
  return { eintraege, naechsteId }
}

const kategorien = await ladeStartdaten('kategorien')
const standorte = await ladeStartdaten('standorte')
const typen = [{ id: 1, name: 'Beamer', beschreibung: 'Mobiler Beamer', kategorie: 1, maximale_ausleihzeit: 7, exemplare: [1] }]
const exemplare = [{ id: 1, inventarnummer: 'DEMO-001', gegenstandstyp: 1, standort_id: 1, zustand: 'gut', verfuegbarkeitsstatus: 'verfuegbar' }]

function entfernung(art, eintrag) {
  if (eintrag.archiviert) return null
  const verwendet = art === 'kategorien'
    ? typen.some(typ => typ.kategorie === eintrag.id)
    : exemplare.some(exemplar => exemplar.standort_id === eintrag.id)
  return verwendet ? 'archivieren' : 'loeschen'
}

function detail(art, eintrag) {
  return { ...eintrag, entfernungsaktion: entfernung(art, eintrag) }
}

function inventarExemplar(exemplar) {
  const typ = typen.find(typ => typ.id === exemplar.gegenstandstyp)
  return { ...exemplar, name: typ.name, kategorie: kategorien.eintraege.get(typ.kategorie).name,
    standort: standorte.eintraege.get(exemplar.standort_id).name }
}

function antwort(res, status, daten) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
  res.end(JSON.stringify(daten))
}

async function eingabeLesen(req) {
  let text = ''
  req.setEncoding('utf8')
  for await (const teil of req) text += teil
  const daten = JSON.parse(text)
  if (!daten || typeof daten !== 'object' || Array.isArray(daten)) throw new Error()
  return daten
}

function felderPruefen(daten, erstellen) {
  const fehler = {}
  const felder = {}
  for (const feld of ['name', 'beschreibung']) {
    if (!erstellen && !Object.hasOwn(daten, feld)) continue
    const wert = typeof daten[feld] === 'string' ? daten[feld].trim() : ''
    if (!wert) fehler[feld] = ['Dieses Feld ist erforderlich.']
    else if (feld === 'name' && Array.from(wert).length > 100) fehler.name = ['Der Name darf höchstens 100 Zeichen enthalten.']
    felder[feld] = wert
  }
  return { fehler, felder }
}

const server = createServer(async (req, res) => {
  const pfad = new URL(req.url, 'http://127.0.0.1').pathname
  if (req.method === 'GET' && pfad === '/api/demo/rechte/') {
    return antwort(res, 200, { canManageInventory: erlaubt })
  }
  const inventarPfad = /^\/api\/inventory\/(typen|exemplare|alle-exemplare)\/(?:(\d+)\/)?$/.exec(pfad)
  if (inventarPfad && req.method === 'GET') {
    const liste = inventarPfad[1] === 'typen' ? typen : exemplare.map(inventarExemplar)
    if (!inventarPfad[2]) return antwort(res, 200, liste)
    const objekt = liste.find(item => item.id === Number(inventarPfad[2]))
    return objekt ? antwort(res, 200, objekt) : antwort(res, 404, { detail: 'Eintrag nicht gefunden.' })
  }
  const treffer = /^\/api\/inventory\/(kategorien|standorte)\/(?:(\d+)\/(archivieren\/)?)?$/.exec(pfad)
  if (!treffer) return antwort(res, 404, { detail: 'Unbekannter Demo-Endpunkt.' })
  if (!erlaubt) return antwort(res, 403, { detail: 'Für diese Aktion fehlt die Berechtigung.' })

  const [, art, idText, archivPfad] = treffer
  const liste = art === 'kategorien' ? kategorien : standorte
  const id = idText ? Number(idText) : null
  const erstellen = req.method === 'POST' && id === null
  const bearbeiten = req.method === 'PATCH' && id !== null && !archivPfad
  let daten
  if (erstellen || bearbeiten) {
    try {
      daten = await eingabeLesen(req)
    } catch {
      return antwort(res, 400, { detail: 'Ein JSON-Objekt mit Feldern wird erwartet.' })
    }
  }

  const eintrag = liste.eintraege.get(id)
  if (id !== null && !eintrag) return antwort(res, 404, { detail: 'Eintrag nicht gefunden.' })
  if (req.method === 'GET' && !archivPfad) {
    if (eintrag) return antwort(res, 200, detail(art, eintrag))
    const aktiv = [...liste.eintraege.values()].filter(item => !item.archiviert)
    return antwort(res, 200, aktiv.map(item => detail(art, item)))
  }
  if (req.method === 'DELETE' && eintrag && !archivPfad) {
    if (entfernung(art, eintrag) !== 'loeschen') return antwort(res, 409, { detail: 'Dieser Eintrag kann nicht gelöscht werden.' })
    liste.eintraege.delete(id)
    return antwort(res, 204)
  }
  if (req.method === 'POST' && archivPfad) {
    if (entfernung(art, eintrag) !== 'archivieren') return antwort(res, 409, { detail: 'Dieser Eintrag kann nicht archiviert werden.' })
    eintrag.archiviert = true
    return antwort(res, 204)
  }
  if (!erstellen && !bearbeiten) return antwort(res, 405, { detail: 'Methode nicht unterstützt.' })
  if (eintrag?.archiviert) return antwort(res, 409, { detail: 'Der Eintrag ist bereits archiviert.' })
  const { fehler, felder } = felderPruefen(daten, erstellen)
  if (Object.keys(fehler).length) return antwort(res, 400, fehler)
  if (erstellen) {
    const neu = { id: liste.naechsteId++, ...felder, archiviert: false }
    liste.eintraege.set(neu.id, neu)
    return antwort(res, 201, detail(art, neu))
  }
  Object.assign(eintrag, felder)
  return antwort(res, 200, detail(art, eintrag))
})

server.listen(8047, '127.0.0.1', () => {
  console.log('Demo-API für #47 auf http://127.0.0.1:8047 (' + (erlaubt ? 'Verleiher' : 'Ausleiher') + ')')
})
