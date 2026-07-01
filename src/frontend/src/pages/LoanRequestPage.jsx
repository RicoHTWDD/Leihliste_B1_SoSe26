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

function formatDate(value) {
  const digits = value.replace(/\D/g, '').slice(0, 8)

  if (digits.length <= 2) {
    return digits
  }

  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}.${digits.slice(2)}`
  }

  return (
    `${digits.slice(0, 2)}.`
    + `${digits.slice(2, 4)}.`
    + digits.slice(4)
  )
}

function parseDate(value) {
  const match = value.match(
    /^(\d{2})\.(\d{2})\.(\d{4})$/,
  )

  if (!match) {
    return null
  }

  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])

  const date = new Date(year, month - 1, day)
  date.setHours(0, 0, 0, 0)

  if (
    date.getDate() !== day
    || date.getMonth() !== month - 1
    || date.getFullYear() !== year
  ) {
    return null
  }

  return date
}

function LoanRequestPage() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedItems, setSelectedItems] = useState([])
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')

  function toggleItem(itemId) {
    setSelectedItems((currentItems) => (
      currentItems.includes(itemId)
        ? currentItems.filter((id) => id !== itemId)
        : [...currentItems, itemId]
    ))
  }

  function handleSubmit(event) {
    event.preventDefault()

    const start = parseDate(startDate)
    const end = parseDate(endDate)

    if (!start || !end) {
      setError('Bitte beide Daten vollständig eingeben.')
      return
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (start < today || end < today) {
      setError(
        'Start- und Enddatum dürfen nicht in der Vergangenheit liegen.',
      )
      return
    }

    if (end < start) {
      setError(
        'Das Enddatum darf nicht vor dem Startdatum liegen.',
      )
      return
    }

    if (selectedItems.length === 0) {
      setError('Bitte mindestens einen Gegenstand auswählen.')
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
              placeholder="TT.MM.JJJJ"
              value={startDate}
              onChange={(event) => {
                setStartDate(
                  formatDate(event.target.value),
                )
                setError('')
              }}
              slotProps={{
                htmlInput: {
                  inputMode: 'numeric',
                  maxLength: 10,
                },
              }}
            />

            <TextField
              label="Enddatum"
              placeholder="TT.MM.JJJJ"
              value={endDate}
              onChange={(event) => {
                setEndDate(
                  formatDate(event.target.value),
                )
                setError('')
              }}
              slotProps={{
                htmlInput: {
                  inputMode: 'numeric',
                  maxLength: 10,
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
                    : 'ausgeliehen'
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
            title="Formular unvollständig"
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