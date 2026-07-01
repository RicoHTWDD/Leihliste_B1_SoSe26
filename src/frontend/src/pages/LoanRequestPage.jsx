import { useState } from 'react'

import {
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from '@mui/material'

import ErrorMessage from '../components/ui/ErrorMessage.jsx'
import StatusBadge from '../components/ui/StatusBadge.jsx'
import {
  getToday,
  validateDates,
} from '../utils/dateValidation.js'

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
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedItems, setSelectedItems] = useState([])
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')

  const today = getToday()

  function toggleItem(itemId) {
    setSelectedItems((currentItems) => (
      currentItems.includes(itemId)
        ? currentItems.filter((id) => id !== itemId)
        : [...currentItems, itemId]
    ))

    setError('')
  }

  function handleSubmit(event) {
    event.preventDefault()

    const dateError = validateDates(
      startDate,
      endDate,
    )

    if (dateError) {
      setError(dateError)
      return
    }

    if (selectedItems.length === 0) {
      setError(
        'Bitte mindestens einen Gegenstand auswählen.',
      )
      return
    }

    setError('')

    // API-Anbindung kommt später hier hinein.
  }

  function handleReset() {
    setStartDate('')
    setEndDate('')
    setSelectedItems([])
    setComment('')
    setError('')
  }

  return (
    <>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
      >
        Neue Anfrage
      </Typography>

      <Stack
        component="form"
        spacing={3}
        onSubmit={handleSubmit}
        onReset={handleReset}
      >
        <Stack spacing={2}>
          <Typography
            variant="h5"
            component="h2"
          >
            Zeitraum wählen
          </Typography>

          <Stack
            direction={{
              xs: 'column',
              md: 'row',
            }}
            spacing={2}
          >
            <TextField
              label="Startdatum"
              type="date"
              value={startDate}
              onChange={(event) => {
                setStartDate(event.target.value)
                setError('')
              }}
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
                htmlInput: {
                  min: today,
                },
              }}
            />

            <TextField
              label="Enddatum"
              type="date"
              value={endDate}
              onChange={(event) => {
                setEndDate(event.target.value)
                setError('')
              }}
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
                htmlInput: {
                  min: startDate || today,
                },
              }}
            />
          </Stack>
        </Stack>

        <Divider />

        <Stack spacing={2}>
          <Typography
            variant="h5"
            component="h2"
          >
            Gegenstände auswählen
          </Typography>

          {items.map((item) => (
            <Stack
              key={item.id}
              direction="row"
              spacing={2}
              alignItems="center"
            >
              <FormControlLabel
                label={item.name}
                disabled={!item.available}
                control={(
                  <Checkbox
                    checked={selectedItems.includes(item.id)}
                    onChange={() => toggleItem(item.id)}
                  />
                )}
              />

              <StatusBadge
                status={
                  item.available
                    ? 'verfuegbar'
                    : 'nicht_verfuegbar'
                }
              />
            </Stack>
          ))}
        </Stack>

        <Divider />

        <Stack spacing={2}>
          <Typography
            variant="h5"
            component="h2"
          >
            Kommentar hinzufügen (optional)
          </Typography>

          <TextField
            multiline
            minRows={3}
            placeholder="Kommentar eingeben"
            value={comment}
            onChange={(event) => {
              setComment(event.target.value)
            }}
          />
        </Stack>

        <Divider />

        {error && (
          <ErrorMessage
            title="Formular konnte nicht abgesendet werden"
            message={error}
          />
        )}

        <Stack
          direction="row"
          spacing={2}
        >
          <Button
            type="submit"
            variant="contained"
          >
            Anfrage absenden
          </Button>

          <Button
            type="reset"
            variant="outlined"
          >
            Abbrechen
          </Button>
        </Stack>
      </Stack>
    </>
  )
}

export default LoanRequestPage