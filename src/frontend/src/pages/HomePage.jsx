import { Button, Stack, Typography } from '@mui/material'

export default function HomePage({
  canManageInventory, onInventarAnzeigen, onExemplarAnlegen, onTypAnlegen,
  darfReferenzdatenVerwalten, onKategorienAnzeigen, onStandorteAnzeigen,
}) {
  return (
    <>
      <Typography variant="h4" component="h1" gutterBottom>LeihListe</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} useFlexGap sx={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {canManageInventory && (
          <>
            <Button variant="contained" onClick={onExemplarAnlegen}>Exemplar anlegen</Button>
            <Button variant="outlined" onClick={onTypAnlegen}>Gegenstandstyp anlegen</Button>
          </>
        )}
        <Button onClick={onInventarAnzeigen}>Gegenstände anzeigen</Button>
      </Stack>
      {darfReferenzdatenVerwalten && (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}
          sx={{ mt: 2, alignItems: 'flex-start' }}>
          <Button variant="outlined" onClick={onKategorienAnzeigen}>Kategorien verwalten</Button>
          <Button variant="outlined" onClick={onStandorteAnzeigen}>Standorte verwalten</Button>
        </Stack>
      )}
    </>
  )
}
