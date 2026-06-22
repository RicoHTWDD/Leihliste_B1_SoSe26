import {
  Button,
  Stack,
  Typography,
} from '@mui/material'

function HomePage() {
  return (
    <>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
      >
        LeihListe
      </Typography>

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