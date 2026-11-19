import { useEffect, useRef, useState } from 'react'
import { Alert, Button, Stack, TextField, Typography } from '@mui/material'
import { fehlertext } from '../../utils/exemplarFelder.js'

function pruefeEingaben({ name, beschreibung }) {
  const fehler = {}
  if (!name) fehler.name = 'Bitte einen Namen angeben.'
  else if (Array.from(name).length > 100) fehler.name = 'Der Name darf höchstens 100 Zeichen enthalten.'
  if (!beschreibung) fehler.beschreibung = 'Bitte eine Beschreibung angeben.'
  return fehler
}

export default function ReferenzdatenFormular({ art, initialData = null, onSpeichern, onAbbrechen }) {
  const [werte, setWerte] = useState(() => ({
    name: initialData?.name ?? '',
    beschreibung: initialData?.beschreibung ?? '',
  }))
  const [geprueft, setGeprueft] = useState({})
  const [feldfehler, setFeldfehler] = useState({})
  const [meldung, setMeldung] = useState('')
  const [speichert, setSpeichert] = useState(false)
  const angefragt = useRef(false)
  const aktiv = useRef(true)
  const daten = { name: werte.name.trim(), beschreibung: werte.beschreibung.trim() }
  const lokal = pruefeEingaben(daten)

  useEffect(() => {
    aktiv.current = true
    return () => { aktiv.current = false }
  }, [])

  function feld(name) {
    const fehler = feldfehler[name] || (geprueft[name] && lokal[name])
    return {
      name, required: true, fullWidth: true, value: werte[name], disabled: speichert,
      error: Boolean(fehler),
      helperText: fehler || (name === 'name' ? 'Höchstens 100 Zeichen.' : undefined),
      slotProps: { formHelperText: { 'aria-live': 'polite' } },
      onBlur: () => setGeprueft(alt => ({ ...alt, [name]: true })),
      onChange: event => {
        const wert = event.target.value
        setWerte(alt => ({ ...alt, [name]: wert }))
        setGeprueft(alt => ({ ...alt, [name]: true }))
        setFeldfehler(alt => ({ ...alt, [name]: '' }))
        setMeldung('')
      },
    }
  }

  async function speichern(event) {
    event.preventDefault()
    if (angefragt.current) return
    setGeprueft({ name: true, beschreibung: true })
    const [ungueltig] = Object.keys(lokal)
    if (ungueltig) {
      event.currentTarget.elements.namedItem(ungueltig)?.focus()
      return
    }

    angefragt.current = true
    setSpeichert(true)
    setFeldfehler({})
    setMeldung('')
    try {
      await onSpeichern(daten)
    } catch (fehler) {
      if (!aktiv.current) return
      const antwort = fehler.fields ?? {}
      const amFeld = {
        name: fehlertext(antwort.name),
        beschreibung: fehlertext(antwort.beschreibung),
      }
      if (Object.hasOwn(amFeld, antwort.feld)) amFeld[antwort.feld] = fehlertext(antwort.meldung)
      setFeldfehler(amFeld)
      const allgemein = fehlertext(antwort.non_field_errors) || fehlertext(antwort.detail)
      setMeldung(allgemein || (amFeld.name || amFeld.beschreibung ? '' : fehler.message))
    } finally {
      angefragt.current = false
      if (aktiv.current) setSpeichert(false)
    }
  }

  return (
    <Stack component="form" noValidate onSubmit={speichern} aria-busy={speichert}
      spacing={2} sx={{ maxWidth: 620 }}>
      <Typography variant="h4" component="h1">{art} {initialData ? 'bearbeiten' : 'anlegen'}</Typography>
      {meldung && <Alert severity="error">{meldung}</Alert>}
      <TextField label="Name" {...feld('name')} />
      <TextField multiline minRows={3} label="Beschreibung" {...feld('beschreibung')} />
      <Stack direction="row" spacing={1}>
        <Button type="submit" variant="contained" disabled={speichert}>
          {speichert ? 'Wird gespeichert …' : 'Speichern'}
        </Button>
        <Button type="button" variant="outlined" disabled={speichert} onClick={onAbbrechen}>Abbrechen</Button>
      </Stack>
    </Stack>
  )
}
