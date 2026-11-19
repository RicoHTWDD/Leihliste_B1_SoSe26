import { useEffect, useRef, useState } from 'react'
import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material'
import { ErrorMessage, StatusBadge } from '../components/ui'
import AnfrageEntscheidungsDialog from '../components/AnfrageEntscheidungsDialog.jsx'
import { entscheideAnfrage, ladeEingegangeneAnfrage } from '../utils/eingegangeneAnfragenApi.js'
import { formatiereDatum, useAnfragedaten } from './anfrageAnsicht.js'

export default function AnfrageDetail({ id, onZurueck, onAktualisieren }) {
  const { antwort, erneutLaden } = useAnfragedaten(ladeEingegangeneAnfrage, id)
  const [aktion, setAktion] = useState(null)
  const [speichert, setSpeichert] = useState(false)
  const [dialogFehler, setDialogFehler] = useState(null)
  const [meldung, setMeldung] = useState(null)
  const sendet = useRef(false)
  const titel = useRef(null)
  useEffect(() => { titel.current?.focus() }, [id])

  const anfrage = antwort?.daten

  function schliessen() {
    if (sendet.current) return
    setAktion(null)
    setDialogFehler(null)
  }

  async function entscheiden(grund) {
    if (sendet.current || !aktion || anfrage?.anfragestatus !== 'eingereicht') return
    sendet.current = true
    setSpeichert(true)
    setDialogFehler(null)
    setMeldung(null)
    try {
      await entscheideAnfrage(id, aktion, grund)
      setMeldung({ text: aktion === 'genehmigen' ? 'Anfrage bestätigt.' : 'Anfrage abgelehnt.' })
    } catch (fehler) {
      // Eingabefehler lassen sich im Dialog korrigieren, ohne den Grund zu verlieren.
      if (fehler.status === 400) {
        setDialogFehler(fehler)
        return
      }
      setMeldung({ fehler: true, text: fehler.message })
    } finally {
      sendet.current = false
      setSpeichert(false)
    }
    // Auch bei einem Konflikt oder einer unterbrochenen Antwort zählt der Stand auf dem Server.
    setAktion(null)
    erneutLaden()
    onAktualisieren()
  }

  return (
    <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
      <Button variant="outlined" onClick={onZurueck} disabled={speichert}>Zurück zur Übersicht</Button>
      <Typography variant="h4" component="h1" tabIndex={-1} ref={titel}>
        Ausleihanfrage #{id}
      </Typography>
      {meldung && (meldung.fehler
        ? <ErrorMessage message={meldung.text} />
        : <Alert severity="success">{meldung.text}</Alert>)}
      {!antwort && <CircularProgress aria-label="Anfrage wird geladen" />}
      {antwort?.fehler && (
        <>
          <ErrorMessage message={antwort.fehler} />
          <Button onClick={erneutLaden}>Erneut versuchen</Button>
        </>
      )}
      {anfrage && (
        <Paper variant="outlined" sx={{ p: 3, width: '100%', maxWidth: 700, boxSizing: 'border-box' }}>
          <Box component="dl" sx={{
            m: 0, display: 'grid', gap: 1,
            gridTemplateColumns: { xs: '1fr', sm: 'max-content 1fr' },
            '& dt': { fontWeight: 600 }, '& dd': { m: 0, overflowWrap: 'anywhere' },
          }}>
            <dt>Ausleiher</dt><dd>{anfrage.nutzer_name}</dd>
            <dt>Gegenstand</dt><dd>{anfrage.gegenstand_name}</dd>
            <dt>Startdatum</dt><dd>{formatiereDatum(anfrage.startdatum)}</dd>
            <dt>Enddatum</dt><dd>{formatiereDatum(anfrage.enddatum)}</dd>
            <dt>Eingegangen am</dt><dd>{formatiereDatum(anfrage.erstellt_am)}</dd>
            <dt>Status</dt><dd><StatusBadge status={anfrage.anfragestatus} /></dd>
            {anfrage.ablehnungsgrund && (
              <><dt>Ablehnungsgrund</dt><dd>{anfrage.ablehnungsgrund}</dd></>
            )}
          </Box>
          {anfrage.anfragestatus === 'eingereicht' ? (
            <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
              <Button variant="contained" disabled={speichert}
                onClick={() => setAktion('genehmigen')}>Bestätigen</Button>
              <Button variant="outlined" color="error" disabled={speichert}
                onClick={() => setAktion('ablehnen')}>Ablehnen</Button>
            </Stack>
          ) : (
            <Typography variant="body2" sx={{ mt: 2 }}>
              Für diese Anfrage ist keine Entscheidung mehr möglich.
            </Typography>
          )}
          {aktion && (
            <AnfrageEntscheidungsDialog anfrage={anfrage} aktion={aktion} speichert={speichert}
              fehler={dialogFehler} onEingabe={() => setDialogFehler(null)}
              onAbbrechen={schliessen} onEntscheiden={entscheiden} />
          )}
        </Paper>
      )}
    </Stack>
  )
}
