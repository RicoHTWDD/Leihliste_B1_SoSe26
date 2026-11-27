import { useEffect, useState } from 'react'
import { Box, Button, CircularProgress, Pagination, Paper, Stack, Typography } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ErrorMessage from '../components/ui/ErrorMessage.jsx'
import { apiRequest } from '../utils/inventarApi.js'

function auswahlName(liste, id, bekannterName) {
  if (id == null) return 'Keine Angabe'
  return liste?.find((eintrag) => eintrag.id === id)?.name ?? bekannterName ?? ('#' + id)
}

export default function GegenstandstypDetail({
  typId, exemplar, onBack, onExemplarAnzeigen, onBearbeiten, onLoeschen,
  canManageInventory, capabilities,
}) {
  const [typ, setTyp] = useState(null)
  const [fehler, setFehler] = useState('')
  const [beispiel, setBeispiel] = useState(null)
  const [exemplarSeite, setExemplarSeite] = useState(1)

  const ausgewaehltesExemplarId = exemplar?.id

  useEffect(() => {
    const controller = new AbortController()
    apiRequest('/api/inventory/typen/' + typId + '/', { signal: controller.signal })
      .then(async (daten) => {
        if (controller.signal.aborted) return
        setTyp(daten)
        // Die Kategoriebezeichnung kommt aus der Detailansicht eines Exemplars.
        const exemplarId = daten.exemplare.includes(ausgewaehltesExemplarId) ? ausgewaehltesExemplarId : daten.exemplare[0]
        if (!exemplarId) return
        try {
          const eintrag = await apiRequest('/api/inventory/exemplare/' + exemplarId + '/', {
            signal: controller.signal,
          })
          if (!controller.signal.aborted) setBeispiel(eintrag)
        } catch {
          // Die Typdetails und alle Exemplar-Links sind auch ohne Namen nutzbar.
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) setFehler(err.message)
      })
    return () => controller.abort()
  }, [typId, ausgewaehltesExemplarId])

  const exemplarListe = typ?.exemplare_details ?? typ?.exemplare?.map((id) => ({ id })) ?? []
  const exemplarSeiten = Math.ceil(exemplarListe.length / 10)
  const angezeigteExemplare = exemplarListe.slice((exemplarSeite - 1) * 10, exemplarSeite * 10)

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ mb: 2 }}>Zurück</Button>
      {fehler && <ErrorMessage message={fehler} />}
      {!typ && !fehler && <CircularProgress aria-label="Gegenstandstyp wird geladen" />}
      {typ && (
        <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
          <Typography variant="h4" component="h1">{typ.name}</Typography>
          {typ.beschreibung && <Typography>{typ.beschreibung}</Typography>}
          <Box>
            <Typography>Kategorie: {auswahlName(capabilities?.kategorien, typ.kategorie, beispiel?.kategorie)}</Typography>
            <Typography>Maximale Ausleihzeit in Tagen: {typ.maximale_ausleihzeit}</Typography>
          </Box>
          <Box>
            <Typography variant="h6" component="h2">Exemplare</Typography>
            <Box component="ul" sx={{ m: 0, pl: 3 }}>
              {angezeigteExemplare.map(({ id, inventarnummer }) => (
                <li key={id}>
                  <Button onClick={() => onExemplarAnzeigen(id)}>
                    {inventarnummer ?? 'Exemplar #' + id}
                  </Button>
                </li>
              ))}
            </Box>
            {exemplarSeiten > 1 && (
              <Pagination count={exemplarSeiten} page={exemplarSeite}
                onChange={(_, seite) => setExemplarSeite(seite)} size="small" />
            )}
          </Box>
          {canManageInventory && (
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={() => onBearbeiten(typ)}>Bearbeiten</Button>
              <Button color="error" onClick={() => onLoeschen(typ)}>Löschen</Button>
            </Stack>
          )}
        </Stack>
      )}
    </Paper>
  )
}
