import { useEffect, useRef, useState } from 'react'
import { Alert, Button, MenuItem, Stack, TextField, Typography } from '@mui/material'
import ExemplarFelder from '../components/inventory/ExemplarFelder.jsx'
import ExemplarBildFeld from '../components/inventory/ExemplarBildFeld.jsx'
import StandortFeld from '../components/inventory/StandortFeld.jsx'
import { apiRequest, listAll } from '../utils/inventarApi.js'
import { fehlertext, neuesExemplar, pruefeExemplar } from '../utils/exemplarFelder.js'
import { exemplarAnfrage, pruefeBild } from '../utils/exemplarBild.js'

const exemplareUrl = '/api/inventory/exemplare/'

export default function ExemplarFormular({ initialData = null, onAbbrechen, onSaved, capabilities = {} }) {
  const bearbeiten = initialData !== null
  const [werte, setWerte] = useState(() => neuesExemplar(initialData))
  const [bild, setBild] = useState(undefined)
  const [standort, setStandort] = useState('')
  const [typId, setTypId] = useState(initialData?.gegenstandstyp ?? '')
  const [typen, setTypen] = useState(null)
  const [ladefehler, setLadefehler] = useState('')
  const [ladeversuch, setLadeversuch] = useState(0)
  const [serverfehler, setServerfehler] = useState({})
  const [meldung, setMeldung] = useState('')
  const [geprueft, setGeprueft] = useState(false)
  const [speichert, setSpeichert] = useState(false)
  const aktiv = useRef(true)
  const wirdGesendet = useRef(false)

  useEffect(() => {
    aktiv.current = true
    return () => { aktiv.current = false }
  }, [])

  useEffect(() => {
    if (bearbeiten) return
    const controller = new AbortController()
    listAll('/api/inventory/typen/', { signal: controller.signal })
      .then((liste) => {
        if (!controller.signal.aborted) setTypen(liste)
      })
      .catch((fehler) => {
        if (!controller.signal.aborted) setLadefehler(fehler.message)
      })
    return () => controller.abort()
  }, [bearbeiten, ladeversuch])

  const lokal = pruefeExemplar(werte)
  if (!bearbeiten && !typId) lokal.gegenstand = 'Bitte einen Gegenstandstyp auswählen.'
  const gespeicherterOrt = initialData?.standort?.trim()
  const aktuellerName = gespeicherterOrt === 'Nicht zugewiesen' ? '' : gespeicherterOrt
  if (!standort && !aktuellerName) lokal.standort = 'Bitte einen Standort auswählen.'
  const bildfehler = pruefeBild(bild)
  if (bildfehler) lokal.bild = bildfehler
  const fehler = { ...serverfehler, ...(geprueft ? lokal : {}) }
  // Der Nutzer soll diesen Widerspruch schon beim Auswählen sehen.
  if (lokal.verfuegbarkeitsstatus && werte.verfuegbarkeitsstatus === 'verfuegbar') {
    fehler.verfuegbarkeitsstatus = lokal.verfuegbarkeitsstatus
  }

  function feldAendern(name, wert) {
    setWerte((alt) => ({ ...alt, [name]: wert }))
    setServerfehler((alt) => ({
      ...alt, [name]: undefined,
      ...(name === 'zustand' ? { verfuegbarkeitsstatus: undefined } : {}),
    }))
    setMeldung('')
  }

  function zuruecksetzen() {
    setWerte(neuesExemplar(initialData))
    setBild(undefined)
    setStandort('')
    setTypId(initialData?.gegenstandstyp ?? '')
    setGeprueft(false)
    setServerfehler({})
    setMeldung('')
  }

  async function speichern(event) {
    event.preventDefault()
    setGeprueft(true)
    if (wirdGesendet.current || Object.keys(lokal).length) return

    const daten = { ...werte, inventarnummer: werte.inventarnummer.trim() }
    if (bearbeiten) {
      for (const feld of Object.keys(daten)) {
        if (daten[feld] === initialData[feld]) delete daten[feld]
      }
    } else {
      daten.gegenstand = Number(typId)
    }

    if (standort) daten.standort = Number(standort)

    wirdGesendet.current = true
    setSpeichert(true)
    setServerfehler({})
    setMeldung('')
    try {
      const ergebnis = await apiRequest(bearbeiten ? exemplareUrl + initialData.id + '/' : exemplareUrl, {
        method: bearbeiten ? 'PATCH' : 'POST',
        data: exemplarAnfrage(daten, bild),
      })
      if (aktiv.current) onSaved(ergebnis)
    } catch (fehler) {
      if (aktiv.current) {
        const liste = Array.isArray(fehler.fields) ? fehlertext(fehler.fields) : ''
        if (bild && liste) {
          setServerfehler({ bild: liste })
          setMeldung('')
        } else {
          setServerfehler(fehler.fields ?? {})
          setMeldung(liste || fehler.message)
        }
      }
    } finally {
      wirdGesendet.current = false
      if (aktiv.current) setSpeichert(false)
    }
  }

  function typenErneutLaden() {
    setLadefehler('')
    setTypen(null)
    setLadeversuch((alt) => alt + 1)
  }

  return (
    <Stack component="form" noValidate onSubmit={speichern} spacing={2} sx={{ maxWidth: 620 }}>
      <Typography variant="h4" component="h1">Exemplar {bearbeiten ? 'bearbeiten' : 'anlegen'}</Typography>
      {meldung && <Alert severity="error">{meldung}</Alert>}
      {ladefehler && <Alert severity="error" action={
        <Button type="button" onClick={typenErneutLaden}>Erneut laden</Button>
      }>Gegenstandstypen konnten nicht geladen werden. {ladefehler}</Alert>}
      {bearbeiten ? (
        <TextField label="Gegenstandstyp" value={initialData.name || 'Typ ' + initialData.gegenstandstyp}
          slotProps={{ input: { readOnly: true } }} />
      ) : (
        <>
          <TextField select required label="Gegenstandstyp" value={typId} disabled={!typen?.length || speichert}
            onChange={(event) => {
              setTypId(event.target.value)
              setServerfehler((alt) => ({ ...alt, gegenstand: undefined }))
              setMeldung('')
            }}
            error={Boolean(fehler.gegenstand)}
            helperText={fehlertext(fehler.gegenstand) || (!typen && !ladefehler ? 'Typen werden geladen …' : '')}>
            <MenuItem value=""><em>Bitte auswählen</em></MenuItem>
            {typen?.map((typ) => <MenuItem key={typ.id} value={typ.id}>{typ.name}</MenuItem>)}
          </TextField>
          {typen?.length === 0 && (
            <Alert severity="info">Lege zuerst einen Gegenstandstyp mit seinem ersten Exemplar an.</Alert>
          )}
        </>
      )}

      <ExemplarFelder value={werte} onChange={feldAendern} errors={fehler} disabled={speichert} />
      <StandortFeld value={standort} standorte={capabilities.standorte} aktuellerName={aktuellerName}
        disabled={speichert} error={fehlertext(fehler.standort)} onChange={wert => {
          setStandort(wert)
          setServerfehler(alt => ({ ...alt, standort: undefined }))
          setMeldung('')
        }} />
      <ExemplarBildFeld bild={bild} gespeichert={initialData?.bild}
        fehler={bildfehler || fehlertext(fehler.bild)} disabled={speichert}
        onChange={datei => {
          setBild(datei)
          setServerfehler(alt => ({ ...alt, bild: undefined }))
          setMeldung('')
        }} />

      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
        <Button type="submit" variant="contained" disabled={speichert || (!bearbeiten && !typen?.length)}>
          {speichert ? 'Wird gespeichert …' : 'Speichern'}
        </Button>
        <Button type="button" onClick={zuruecksetzen} disabled={speichert}>Zurücksetzen</Button>
        <Button type="button" variant="outlined" onClick={onAbbrechen} disabled={speichert}>Abbrechen</Button>
      </Stack>
    </Stack>
  )
}
