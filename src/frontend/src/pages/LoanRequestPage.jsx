import {
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from '@mui/material'

const items = [
  {
    id: 1,
    name: 'Beispiel 1',
    available: true,
  },
  {
    id: 2,
    name: 'Beispiel 2',
    available: false,
  },
]

function LoanRequestPage() {
  return (
    <Box>
      <Typography
        variant="h4"
        component="h1"
        sx={{
          fontWeight: 700,
          marginBottom: 3,
        }}
      >
        Neue Anfrage
      </Typography>

      <Box
        component="section"
        sx={{
          marginBottom: 3,
        }}
      >
        <Typography
          variant="h5"
          component="h2"
          sx={{
            fontWeight: 700,
            marginBottom: 2,
          }}
        >
          Zeitraum wählen
        </Typography>

        <Stack
          direction={{
            xs: 'column',
            md: 'row',
          }}
          spacing={3}
        >
          <TextField
            label="Startdatum"
            type="date"
            slotProps={{
              inputLabel: {
                shrink: true,
              },
            }}
            sx={{
              width: {
                xs: '100%',
                md: 360,
              },
            }}
          />

          <TextField
            label="Enddatum"
            type="date"
            slotProps={{
              inputLabel: {
                shrink: true,
              },
            }}
            sx={{
              width: {
                xs: '100%',
                md: 360,
              },
            }}
          />
        </Stack>
      </Box>

      <Divider sx={{ marginBottom: 3 }} />

      <Box
        component="section"
        sx={{
          marginBottom: 3,
        }}
      >
        <Typography
          variant="h5"
          component="h2"
          sx={{
            fontWeight: 700,
            marginBottom: 2,
          }}
        >
          Gegenstände auswählen
        </Typography>

        <Stack spacing={2}>
          {items.map((item) => (
            <Box
              key={item.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <FormControlLabel
                control={<Checkbox />}
                label={item.name}
                disabled={!item.available}
                sx={{
                  minWidth: 220,
                }}
              />

              <Box
                sx={{
                  minWidth: 120,
                  paddingX: 2,
                  paddingY: 0.5,
                  borderRadius: 4,
                  textAlign: 'center',
                  color: item.available
                    ? 'primary.contrastText'
                    : 'text.secondary',
                  backgroundColor: item.available
                    ? 'primary.main'
                    : 'action.disabledBackground',
                }}
              >
                <Typography variant="body2">
                  {item.available ? 'Verfügbar' : 'Nicht verfügbar'}
                </Typography>
              </Box>
            </Box>
          ))}
        </Stack>
      </Box>

      <Divider sx={{ marginBottom: 3 }} />

      <Box
        component="section"
        sx={{
          marginBottom: 3,
        }}
      >
        <Typography
          variant="h5"
          component="h2"
          sx={{
            fontWeight: 700,
            marginBottom: 2,
          }}
        >
          Kommentar hinzufügen (optional)
        </Typography>

        <TextField
          fullWidth
          multiline
          minRows={3}
          placeholder="Kommentar eingeben"
        />
      </Box>

      <Divider sx={{ marginBottom: 3 }} />

      <Stack
        direction={{
          xs: 'column',
          sm: 'row',
        }}
        spacing={2}
      >
        <Button
          type="button"
          variant="contained"
          size="large"
        >
          Anfrage absenden
        </Button>

        <Button
          type="button"
          variant="outlined"
          size="large"
        >
          Abbrechen
        </Button>
      </Stack>
    </Box>
  )
}

export default LoanRequestPage