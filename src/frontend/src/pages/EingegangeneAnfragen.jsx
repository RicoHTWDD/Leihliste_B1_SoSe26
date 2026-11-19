import { useEffect, useRef, useState } from 'react'
import {
  Box, Button, CircularProgress, Link, Paper, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Typography,
} from '@mui/material'
import { ErrorMessage, HintBox, StatusBadge } from '../components/ui'
import { ladeEingegangeneSeite, SEITENGROESSE } from '../utils/eingegangeneAnfragenApi.js'
import AnfrageDetail from './AnfrageDetail.jsx'
import { formatiereDatum, useAnfragedaten } from './anfrageAnsicht.js'

export default function EingegangeneAnfragen({ auswahl, onAuswahl, onBestandGeaendert }) {
  const [seite, setSeite] = useState(1)
  const letzteAuswahl = useRef(null)
  const { antwort, erneutLaden } = useAnfragedaten(ladeEingegangeneSeite, seite)
  const daten = antwort?.daten
  const letzteSeite = daten ? Math.max(1, Math.ceil(daten.count / SEITENGROESSE)) : null

  useEffect(() => {
    if (auswahl === null && daten && letzteAuswahl.current !== null) {
      document.getElementById('eingang-link-' + letzteAuswahl.current)?.focus()
      letzteAuswahl.current = null
    }
  }, [auswahl, daten])

  return (
    <>
      <section hidden={auswahl !== null} aria-labelledby="eingegangene-anfragen-titel">
        <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
          <Typography variant="h4" component="h1" id="eingegangene-anfragen-titel">
            Eingegangene Anfragen
          </Typography>
          {!antwort && <CircularProgress aria-label="Eingegangene Anfragen werden geladen" />}
          {antwort?.fehler && (
            <>
              <ErrorMessage message={antwort.fehler} />
              <Button onClick={erneutLaden}>Erneut versuchen</Button>
            </>
          )}
          {daten?.results.length === 0 && <HintBox message="Es sind keine Anfragen auf dieser Seite vorhanden." />}
          {daten?.results.length > 0 && (
            <TableContainer component={Paper} variant="outlined">
              <Table aria-label="Eingegangene Ausleihanfragen">
                <TableHead>
                  <TableRow>
                    <TableCell>Ausleiher</TableCell>
                    <TableCell>Gegenstand</TableCell>
                    <TableCell>Ausleihzeitraum</TableCell>
                    <TableCell>Eingegangen am</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {daten.results.map(anfrage => (
                    <TableRow key={anfrage.id} hover sx={{ cursor: 'pointer' }} onClick={() => {
                      letzteAuswahl.current = anfrage.id
                      onAuswahl(anfrage.id)
                    }}>
                      <TableCell>{anfrage.nutzer_name}</TableCell>
                      <TableCell>
                        <Link component="button" type="button" id={'eingang-link-' + anfrage.id}
                          underline="always" sx={{ textAlign: 'left' }}
                          aria-label={'Anfrage ' + anfrage.id + ' zu ' + anfrage.gegenstand_name + ' öffnen'}>
                          {anfrage.gegenstand_name}
                        </Link>
                      </TableCell>
                      <TableCell>{formatiereDatum(anfrage.startdatum)} – {formatiereDatum(anfrage.enddatum)}</TableCell>
                      <TableCell>{formatiereDatum(anfrage.erstellt_am)}</TableCell>
                      <TableCell><StatusBadge status={anfrage.anfragestatus} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          {(seite > 1 || letzteSeite > 1) && (
            <Box component="nav" aria-label="Seitennavigation für eingegangene Anfragen"
              sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <Button variant="outlined" disabled={seite === 1}
                onClick={() => setSeite(seite - 1)}>Zurück</Button>
              <Typography component="span" aria-live="polite">
                Seite {seite}{letzteSeite && ' von ' + letzteSeite}
              </Typography>
              <Button variant="outlined" disabled={!daten || seite >= letzteSeite}
                onClick={() => setSeite(seite + 1)}>Weiter</Button>
            </Box>
          )}
        </Stack>
      </section>
      {auswahl !== null && (
        <AnfrageDetail key={auswahl} id={auswahl}
          onZurueck={() => onAuswahl(null)} onAktualisieren={() => {
            erneutLaden()
            onBestandGeaendert()
          }} />
      )}
    </>
  )
}
