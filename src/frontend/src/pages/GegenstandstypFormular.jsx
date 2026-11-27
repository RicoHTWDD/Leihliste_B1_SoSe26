
import { useEffect, useRef, useState } from 'react'
import { Alert, Box, Button, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'
import StandortFeld from '../components/inventory/StandortFeld.jsx'
import ExemplarFelder from '../components/inventory/ExemplarFelder.jsx'
import { fehlertext, neuesExemplar, pruefeExemplar } from '../utils/exemplarFelder.js'
import { apiRequest, listAll } from '../utils/inventarApi.js'

const typenUrl = '/api/inventory/typen/'

function typWerte(typ) {
  return {
    name: typ?.name ?? '',
    beschreibung: typ?.beschreibung ?? '',
    kategorie: String(typ?.kategorie ?? ''),
    maximale_ausleihzeit: String(typ?.maximale_ausleihzeit ?? ''),
  }
}

function typPruefen(werte) {
  const fehler = {}
  if (!werte.name.trim()) fehler.name = 'Bitte einen Namen angeben.'
  else if (Array.from(werte.name.trim()).length > 100) fehler.name = 'Der Name darf höchstens 100 Zeichen haben.'
  if (!werte.beschreibung.trim()) fehler.beschreibung = 'Bitte eine Beschreibung angeben.'
  if (!werte.kategorie) fehler.kategorie = 'Bitte eine Kategorie auswählen.'
  const tage = Number(werte.maximale_ausleihzeit)
  if (!Number.isSafeInteger(tage) || tage < 1) {
    fehler.maximale_ausleihzeit = 'Bitte die Ausleihzeit in ganzen Tagen angeben (mindestens 1).'
  }
  return fehler
}

function neueZeile(key) {
  return { key, daten: { ...neuesExemplar(), standort: '' } }
}

function ohneFelder(daten, ...felder) {
  const kopie = { ...daten }
  for (const feld of felder) delete kopie[feld]
  return kopie
}

function zeilenPruefen(zeilen) {
  const nummern = new Set()
  const fehler = {}
  zeilen.forEach(({ daten }, index) => {
    const zeilenfehler = pruefeExemplar(daten)
    const standortId = Number(daten.standort)
    if (!Number.isSafeInteger(standortId) || standortId < 1) {
      zeilenfehler.standort = 'Bitte einen Standort auswählen.'
    }
    const nummer = daten.inventarnummer.trim()
    if (nummer && nummern.has(nummer)) {
      zeilenfehler.inventarnummer = 'Diese Inventarnummer wird bereits in diesem Formular verwendet.'
    }
    nummern.add(nummer)
    if (Object.keys(zeilenfehler).length) fehler[index] = zeilenfehler
  })
  return fehler
}

// Ohne Kategorien-Endpunkt stehen die im Inventar verwendeten Kategorien zur Auswahl.
// Die Exemplarliste liefert die zugehörigen Anzeigenamen.
function verwendeteKategorien(typen, exemplare) {
  const nachTyp = new Map(exemplare.map(exemplar => [exemplar.gegenstandstyp, exemplar]))
  const eintraege = new Map()
  for (const typ of typen) {
    const id = typ.kategorie
    if (id == null) continue
    const name = nachTyp.get(typ.id)?.kategorie
    if (name || !eintraege.has(id)) eintraege.set(id, { id, name: name || `Kategorie #${id}` })
  }
  return [...eintraege.values()].sort((a, b) => a.name.localeCompare(b.name, 'de'))
}

export default function GegenstandstypFormular({ initialData = null, capabilities = {}, onAbbrechen, onSaved }) {
  const bearbeiten = initialData !== null
  const [werte, setWerte] = useState(() => typWerte(initialData))
  const [zeilen, setZeilen] = useState(() => [neueZeile(0)])
  const naechsterKey = useRef(1)
  const [serverfehler, setServerfehler] = useState({})
  const [geprueft, setGeprueft] = useState(false)
  const [meldung, setMeldung] = useState('')
  const [sendet, setSendet] = useState(false)
  const anfrageAktiv = useRef(false)
  const angezeigt = useRef(true)
  const [inventarKategorien, setInventarKategorien] = useState(null)
  const [ladefehler, setLadefehler] = useState('')
  const [versuch, setVersuch] = useState(0)
  const brauchtKategorien = !Array.isArray(capabilities.kategorien)

  useEffect(() => {
    angezeigt.current = true
    return () => { angezeigt.current = false }
  }, [])

  useEffect(() => {
    if (!brauchtKategorien) return
    const controller = new AbortController()
    const optionen = { signal: controller.signal }
    Promise.all([listAll(typenUrl, optionen), listAll('/api/inventory/alle-exemplare/', optionen)])
      .then(([typen, exemplare]) => {
        if (!controller.signal.aborted) {
          setInventarKategorien(verwendeteKategorien(typen, exemplare))
        }
      })
      .catch(error => {
        if (!controller.signal.aborted) setLadefehler(error.message)
      })
    return () => controller.abort()
  }, [brauchtKategorien, versuch])

  function zuruecksetzen() {
    setWerte(typWerte(initialData))
    setZeilen([neueZeile(naechsterKey.current++)])
    setGeprueft(false)
    setServerfehler({})
    setMeldung('')
  }

  function feldAendern(name, wert) {
    setWerte(alt => ({ ...alt, [name]: wert }))
    setServerfehler(alt => ohneFelder(alt, name))
    setMeldung('')
  }

  function zeileAendern(index, feld, wert) {
    setZeilen(alt => alt.map((zeile, position) => position === index
      ? { ...zeile, daten: { ...zeile.daten, [feld]: wert } }
      : zeile))
    setServerfehler(alt => ({
      ...alt,
      exemplare: { ...alt.exemplare, [index]: ohneFelder(alt.exemplare?.[index], feld) },
    }))
    setMeldung('')
  }

  async function speichern(event) {
    event.preventDefault()
    if (anfrageAktiv.current) return
    setGeprueft(true)
    setMeldung('')
    setServerfehler({})
    if (Object.keys(typPruefen(werte)).length) return
    if (!bearbeiten && Object.keys(zeilenPruefen(zeilen)).length) return

    const daten = {
      name: werte.name.trim(),
      beschreibung: werte.beschreibung.trim(),
      kategorie: Number(werte.kategorie),
      maximale_ausleihzeit: Number(werte.maximale_ausleihzeit),
    }
    if (bearbeiten) {
      for (const feld of Object.keys(daten)) {
        if (daten[feld] === initialData[feld]) delete daten[feld]
      }
    } else {
      daten.exemplare = zeilen.map(({ daten: exemplar }) => ({
        ...exemplar,
        inventarnummer: exemplar.inventarnummer.trim(),
        standort: Number(exemplar.standort),
      }))
    }

    anfrageAktiv.current = true
    setSendet(true)
    try {
      const gespeichert = await apiRequest(bearbeiten ? `${typenUrl}${initialData.id}/` : typenUrl, {
        method: bearbeiten ? 'PATCH' : 'POST',
        data: daten,
      })
      if (angezeigt.current) onSaved(gespeichert)
    } catch (error) {
      if (angezeigt.current) {
        setServerfehler(error.fields ?? {})
        setMeldung(error.message)
      }
    } finally {
      anfrageAktiv.current = false
      if (angezeigt.current) setSendet(false)
    }
  }

  const fehler = { ...(geprueft ? typPruefen(werte) : {}), ...serverfehler }
  const lokalZeilen = geprueft && !bearbeiten ? zeilenPruefen(zeilen) : {}
  const laedt = brauchtKategorien && inventarKategorien === null && !ladefehler

  function textProps(name, label) {
    const hinweis = fehlertext(fehler[name])
    return {
      name, label, required: true, fullWidth: true, disabled: sendet,
      value: werte[name], error: Boolean(hinweis), helperText: hinweis || undefined,
      onChange: event => feldAendern(name, event.target.value),
    }
  }

  const kategorien = capabilities.kategorien ?? inventarKategorien ?? []
  const alteKategorie = initialData?.kategorie
  const kategorieFehlt = alteKategorie != null && !kategorien.some(eintrag => String(eintrag.id) === String(alteKategorie))

  return (
    <Box component="form" noValidate onSubmit={speichern} aria-busy={sendet} sx={{ maxWidth: 640 }}>
      <Stack spacing={2}>
        <Typography variant="h4" component="h1">
          Gegenstandstyp {bearbeiten ? 'bearbeiten' : 'anlegen'}
        </Typography>
        {meldung && <Alert severity="error">{meldung}</Alert>}
        <TextField {...textProps('name', 'Name')} slotProps={{ htmlInput: { maxLength: 100 } }} />
        <TextField {...textProps('beschreibung', 'Beschreibung')} multiline minRows={2} />
        {laedt && <Typography role="status">Kategorien werden geladen …</Typography>}
        {ladefehler && (
          <Alert severity="error" action={<Button onClick={() => {
            setLadefehler('')
            setVersuch(alt => alt + 1)
          }}>Erneut laden</Button>}>
            {ladefehler}
          </Alert>
        )}
        {brauchtKategorien && inventarKategorien && (
          <Typography variant="body2" color="text.secondary">
            Die Auswahl enthält die im Inventar verwendeten Kategorien.
          </Typography>
        )}
        <TextField select {...textProps('kategorie', 'Kategorie')} disabled={sendet || laedt}>
          <MenuItem value=""><em>Bitte auswählen</em></MenuItem>
          {kategorieFehlt && <MenuItem value={String(alteKategorie)}>Kategorie #{alteKategorie}</MenuItem>}
          {kategorien.map(({ id, name }) => <MenuItem key={id} value={String(id)}>{name}</MenuItem>)}
        </TextField>
        <TextField {...textProps('maximale_ausleihzeit', 'Maximale Ausleihzeit (Tage)')}
          type="number" slotProps={{ htmlInput: { min: 1, step: 1 } }} />
        {!bearbeiten && (
          <>
            <Typography component="h2" variant="h6">Exemplare</Typography>
            <Typography variant="body2" color="text.secondary">
              Ein Foto kannst du nach dem Speichern unter „Exemplar bearbeiten“ hinzufügen.
            </Typography>
            {typeof fehler.exemplare?.[0] === 'string' && <Alert severity="error">{fehlertext(fehler.exemplare)}</Alert>}
            {zeilen.map((zeile, index) => {
              const zeilenfehler = { ...lokalZeilen[index], ...serverfehler.exemplare?.[index] }
              return (
                <Paper component="fieldset" variant="outlined" key={zeile.key} sx={{ p: 2, minWidth: 0 }}>
                  <legend>Exemplar {index + 1}</legend>
                  <Stack spacing={2}>
                    <ExemplarFelder value={zeile.daten} disabled={sendet}
                      onChange={(feld, wert) => zeileAendern(index, feld, wert)}
                      errors={zeilenfehler} />
                    <StandortFeld value={zeile.daten.standort} standorte={capabilities.standorte}
                      onChange={wert => zeileAendern(index, 'standort', wert)}
                      error={fehlertext(zeilenfehler.standort)} disabled={sendet} />
                    {zeilen.length > 1 && <Button type="button" disabled={sendet} onClick={() => {
                      setZeilen(alt => alt.filter(eintrag => eintrag.key !== zeile.key))
                      setServerfehler(alt => ohneFelder(alt, 'exemplare'))
                      setMeldung('')
                    }}>Exemplar entfernen</Button>}
                  </Stack>
                </Paper>
              )
            })}
            <Button type="button" disabled={sendet} sx={{ alignSelf: 'flex-start' }} onClick={() => {
              const zeile = neueZeile(naechsterKey.current++)
              setZeilen(alt => [...alt, zeile])
            }}>Exemplar hinzufügen</Button>
          </>
        )}
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
          <Button variant="contained" type="submit" disabled={sendet || laedt}>Speichern</Button>
          <Button type="button" disabled={sendet} onClick={zuruecksetzen}>Zurücksetzen</Button>
          <Button type="button" variant="outlined" disabled={sendet} onClick={onAbbrechen}>Abbrechen</Button>
        </Stack>
      </Stack>
    </Box>
  )
}