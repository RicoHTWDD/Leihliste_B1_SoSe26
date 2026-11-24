import { Button, Stack, Typography } from '@mui/material'

export default function HomePage({ canManageInventory, onInventarAnzeigen, onExemplarAnlegen, onTypAnlegen }) {
  return (
    <>
      <Typography variant="h4" component="h1" gutterBottom>LeihListe</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'flex-start' }}>
        {canManageInventory && (
          <>
            <Button variant="contained" onClick={onExemplarAnlegen}>Exemplar anlegen</Button>
            <Button variant="outlined" onClick={onTypAnlegen}>Gegenstandstyp anlegen</Button>
          </>
        )}
        <Button onClick={onInventarAnzeigen}>Gegenstände anzeigen</Button>
      </Stack>
    </>
  )
}
