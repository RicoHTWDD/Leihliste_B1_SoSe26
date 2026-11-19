import {
  Alert, Button, Card, CardActionArea, CircularProgress,
  Stack,
  Typography,
} from '@mui/material'
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { ladeAnzahlAnfragen } from '../utils/eingegangeneAnfragenApi.js'
import { useAnfragedaten } from './anfrageAnsicht.js'

function OffeneAnfragenKachel({ onOeffnen }) {
  const { antwort, erneutLaden } = useAnfragedaten(ladeAnzahlAnfragen, 'eingereicht')
  return (
    <Card variant="outlined" sx={{ maxWidth: 360, mb: 2 }}>
      <CardActionArea onClick={onOeffnen} sx={{ p: 2.5, display: 'flex', gap: 2 }}>
        <InboxOutlinedIcon color="primary" />
        <Typography component="span" variant="h6" sx={{ flex: 1 }} aria-live="polite">
          {antwort?.daten != null ? 'Offene Anfragen: ' + antwort.daten : 'Offene Anfragen'}
        </Typography>
        {!antwort ? <CircularProgress size={20} aria-label="Anzahl wird geladen" /> : <ChevronRightIcon />}
      </CardActionArea>
      {antwort?.fehler && (
        <Alert severity="warning" action={<Button onClick={erneutLaden}>Erneut versuchen</Button>}>
          Anzahl konnte nicht geladen werden.
        </Alert>
      )}
    </Card>
  )
}

function HomePage({ onEingangOeffnen, datenstand }) {
  return (
    <>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
      >
        LeihListe
      </Typography>

      {onEingangOeffnen && (
        <OffeneAnfragenKachel key={datenstand} onOeffnen={onEingangOeffnen} />
      )}

      <Stack
        direction="row"
        spacing={2}
      >
        <Button variant="contained">
          Primärer Button
        </Button>

        <Button variant="outlined">
          Sekundärer Button
        </Button>
      </Stack>
    </>
  )
}

export default HomePage
