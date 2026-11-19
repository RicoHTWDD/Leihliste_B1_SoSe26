import { useEffect, useState } from 'react'
import {
  Alert, Button, CircularProgress, List, ListItem, ListItemButton, ListItemText, Paper, Stack, Typography,
} from '@mui/material'
import ReferenzdatenFormular from '../components/inventory/ReferenzdatenFormular.jsx'
import LoeschDialog from '../components/ui/LoeschDialog.jsx'
import { apiRequest, listAll } from '../utils/inventarApi.js'
import { mitGespeichertemEintrag } from '../utils/referenzbereiche.js'

function ressourcenUrl(url, id) {
  const ziel = new URL(url, window.location.origin)
  if (!ziel.pathname.endsWith('/')) ziel.pathname += '/'
  if (id != null) ziel.pathname += encodeURIComponent(id) + '/'
  return ziel.href
}

async function leseListe(pfad, optionen) {
  const liste = await listAll(pfad, optionen)
  if (liste.some(eintrag => eintrag?.id == null || typeof eintrag.name !== 'string')) {
    throw new Error('Der Server hat eine ungültige Übersicht zurückgegeben.')
  }
  return liste
}

function useLaden(pfad, lesen) {
  const [antwort, setAntwort] = useState(null)
  const [versuch, setVersuch] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    lesen(pfad, { signal: controller.signal }).then(daten => {
      if (!controller.signal.aborted) setAntwort({ daten })
    }).catch(error => {
      if (!controller.signal.aborted) setAntwort({ fehler: error.message })
    })
    return () => controller.abort()
  }, [pfad, lesen, versuch])

  function erneutLaden() {
    setAntwort(null)
    setVersuch(alt => alt + 1)
  }

  return { antwort, setAntwort, erneutLaden }
}

function Ladestatus({ fehler, label, erneutLaden }) {
  if (!fehler) return <CircularProgress aria-label={label} />
  return (
    <Alert severity="error" action={<Button onClick={erneutLaden}>Erneut laden</Button>}>
      {fehler}
    </Alert>
  )
}

function Detailansicht({ art, pfad, id, bearbeiten, onZurueck, onBearbeiten, onAbbrechen, onSpeichern, onEntfernen }) {
  const { antwort, setAntwort, erneutLaden } = useLaden(pfad, apiRequest)
  const [dialogOffen, setDialogOffen] = useState(false)
  const daten = antwort?.daten
  const gueltig = daten?.id != null && String(daten.id) === String(id) && typeof daten.name === 'string'
  const archivieren = daten?.entfernungsaktion === 'archivieren'
  const darfEntfernen = archivieren || daten?.entfernungsaktion === 'loeschen'
  const aktion = archivieren ? 'Archivieren' : 'Löschen'

  async function bestaetigen() {
    try {
      await onEntfernen(daten)
    } catch (error) {
      // Erst neue Detaildaten laden. Eine geänderte Zuordnung kann eine
      // andere Aktion erfordern, der der Nutzer erneut zustimmen muss.
      setDialogOffen(false)
      setAntwort({ fehler: error.status === 409
        ? 'Die Zuordnungen haben sich geändert. Bitte den Eintrag erneut laden.'
        : error.message })
    }
  }

  if (bearbeiten && gueltig) {
    return (
      <ReferenzdatenFormular art={art} initialData={daten} onAbbrechen={onAbbrechen}
        onSpeichern={werte => onSpeichern(werte, daten)} />
    )
  }

  return (
    <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
      <Button onClick={onZurueck}>Zur Übersicht</Button>
      {gueltig ? (
        <Paper variant="outlined" sx={{ p: 3, maxWidth: '100%' }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ overflowWrap: 'anywhere' }}>
            {daten.name}
          </Typography>
          <Typography sx={{ mb: 2, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
            {daten.beschreibung || 'Keine Beschreibung vorhanden.'}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={onBearbeiten}>Bearbeiten</Button>
            {darfEntfernen && <Button color="error" onClick={() => setDialogOffen(true)}>{aktion}</Button>}
          </Stack>
          {darfEntfernen && dialogOffen && (
            <LoeschDialog titel={art + ' „' + daten.name + '“ ' + aktion.toLowerCase() + '?'}
              hinweis={archivieren
                ? 'Bestehende Zuordnungen bleiben erhalten. Für neue Zuordnungen steht der Eintrag danach nicht mehr zur Auswahl.'
                : 'Der Eintrag wird endgültig gelöscht.'}
              aktion={aktion} fortschritt={archivieren ? 'Wird archiviert …' : 'Wird gelöscht …'}
              onAbbrechen={() => setDialogOffen(false)} onBestaetigen={bestaetigen} />
          )}
        </Paper>
      ) : (
        <Ladestatus label={art + ' wird geladen'} erneutLaden={erneutLaden}
          fehler={antwort && (antwort.fehler || 'Der Server hat keinen gültigen Eintrag zurückgegeben.')} />
      )}
    </Stack>
  )
}

export default function ReferenzdatenVerwaltung({ art, url, onGespeichert }) {
  const plural = art === 'Kategorie' ? 'Kategorien' : 'Standorte'
  const basis = ressourcenUrl(url)
  const { antwort, setAntwort, erneutLaden } = useLaden(basis, leseListe)
  const [auswahl, setAuswahl] = useState({ seite: 'liste' })
  const [meldung, setMeldung] = useState(null)

  function oeffnen(seite, id) {
    setMeldung(null)
    setAuswahl({ seite, id })
  }

  function zugriffVerweigert(error) {
    if (error.status !== 401 && error.status !== 403) return false
    oeffnen('liste')
    setAntwort({ fehler: error.status === 401
      ? 'Bitte erneut anmelden, um die Verwaltung zu öffnen.'
      : 'Für die Verwaltung fehlt die Berechtigung.' })
    return true
  }

  function zeigeGespeicherteListe(liste, text) {
    onGespeichert?.(liste)
    setAntwort({ daten: liste })
    setAuswahl({ seite: 'liste' })
    setMeldung({ typ: 'success', text })
  }

  async function entfernen(eintrag) {
    const archivieren = eintrag.entfernungsaktion === 'archivieren'
    if (!archivieren && eintrag.entfernungsaktion !== 'loeschen') return
    const detail = ressourcenUrl(basis, eintrag.id)
    try {
      if (archivieren) await apiRequest(ressourcenUrl(detail, 'archivieren'), { method: 'POST' })
      else await apiRequest(detail, { method: 'DELETE' })
    } catch (error) {
      if (zugriffVerweigert(error)) return
      if (error.status !== 404) throw error
      oeffnen('liste')
      erneutLaden()
      setMeldung({ typ: 'warning', text: 'Der Eintrag oder die angeforderte Aktion wurde nicht gefunden.' })
      return
    }
    const liste = antwort.daten.filter(item => String(item.id) !== String(eintrag.id))
    zeigeGespeicherteListe(liste, art + ' „' + eintrag.name + '“ wurde ' + (archivieren ? 'archiviert.' : 'gelöscht.'))
  }

  async function speichern(werte, bisher) {
    const pfad = ressourcenUrl(basis, bisher?.id)
    const data = bisher
      ? Object.fromEntries(Object.entries(werte).filter(([feld, wert]) => wert !== bisher[feld]))
      : werte
    let eintrag
    try {
      eintrag = await apiRequest(pfad, { method: bisher ? 'PATCH' : 'POST', data })
    } catch (error) {
      if (!zugriffVerweigert(error)) throw error
      return
    }
    if (eintrag?.id == null || typeof eintrag.name !== 'string' || (bisher && String(eintrag.id) !== String(bisher.id))) {
      // Eine erfolgreiche Antwort kann schon einen Schreibvorgang ausgelöst haben.
      // Die Liste neu lesen, statt ein erneutes Absenden des Formulars anzubieten.
      oeffnen('liste')
      erneutLaden()
      setMeldung({ typ: 'warning', text: 'Der Server hat die Anfrage bestätigt. Bitte den Eintrag in der Übersicht prüfen.' })
      return
    }

    const liste = mitGespeichertemEintrag(antwort.daten, eintrag)
    zeigeGespeicherteListe(liste, art + ' „' + eintrag.name + '“ wurde ' + (bisher ? 'gespeichert.' : 'angelegt.'))
  }

  if (auswahl.seite === 'anlegen') {
    return <ReferenzdatenFormular art={art} initialData={null} onSpeichern={werte => speichern(werte)}
      onAbbrechen={() => oeffnen('liste')} />
  }
  if (auswahl.id != null) {
    return (
      <Detailansicht key={auswahl.seite + '-' + auswahl.id} art={art}
        id={auswahl.id} pfad={ressourcenUrl(basis, auswahl.id)} bearbeiten={auswahl.seite === 'bearbeiten'}
        onZurueck={() => oeffnen('liste')} onBearbeiten={() => oeffnen('bearbeiten', auswahl.id)}
        onAbbrechen={() => oeffnen('detail', auswahl.id)} onSpeichern={speichern} onEntfernen={entfernen} />
    )
  }

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}
        sx={{ alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between' }}>
        <Typography variant="h4" component="h1">{plural}</Typography>
        {antwort?.daten && <Button variant="contained" onClick={() => oeffnen('anlegen')}>{art} anlegen</Button>}
      </Stack>
      {meldung && <Alert severity={meldung.typ} role="status" onClose={() => setMeldung(null)}>{meldung.text}</Alert>}
      {antwort?.daten ? (
        antwort.daten.length ? (
          <Paper variant="outlined">
            <List aria-label={plural} disablePadding>
              {antwort.daten.map(eintrag => (
                <ListItem key={eintrag.id} disablePadding>
                  <ListItemButton component="button" aria-label={eintrag.name} onClick={() => oeffnen('detail', eintrag.id)}>
                    <ListItemText component="span" primary={eintrag.name} secondary={eintrag.beschreibung}
                      slotProps={{ primary: { component: 'span' }, secondary: { component: 'span' } }}
                      sx={{ overflowWrap: 'anywhere' }} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Paper>
        ) : <Typography>Noch keine {plural} angelegt.</Typography>
      ) : <Ladestatus fehler={antwort?.fehler} label={plural + ' werden geladen'} erneutLaden={erneutLaden} />}
    </Stack>
  )
}
