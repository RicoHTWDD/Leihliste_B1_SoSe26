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

import DateInput from '../components/form/DateInput.jsx'
import ErrorMessage from '../components/ui/ErrorMessage.jsx'
import StatusBadge from '../components/ui/StatusBadge.jsx'
import {
  getTodayIso,
  toIsoDate,
  validateDate,
  validateDateRange,
  validatePartialDate,
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

  const [dateErrors, setDateErrors] = useState({
    startDate: '',
    endDate: '',
  })

  const today = getTodayIso()

  function handleStartDateChange(value) {
    setStartDate(value)
    setError('')

    setDateErrors((currentErrors) => ({
      ...currentErrors,
      startDate: validatePartialDate(value),
    }))
  }

  function handleEndDateChange(value) {
    setEndDate(value)
    setError('')

    setDateErrors((currentErrors) => ({
      ...currentErrors,
      endDate: validatePartialDate(value),
    }))
  }

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

    const newDateErrors = validateDateRange(
      startDate,
      endDate,
    )

    setDateErrors(newDateErrors)

    if (
      newDateErrors.startDate
      || newDateErrors.endDate
    ) {
      setError(
        'Bitte korrigiere die Datumsangaben.',
      )
      return
    }

    if (selectedItems.length === 0) {
      setError(
        'Bitte mindestens einen Gegenstand auszuwählen.',
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

    setDateErrors({
      startDate: '',
      endDate: '',
    })
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
            <DateInput
              label="Startdatum"
              value={startDate}
              minDate={today}
              onChange={handleStartDateChange}
              onBlur={() => {
                setDateErrors((currentErrors) => ({
                  ...currentErrors,
                  startDate: validateDate(
                    startDate,
                    'Startdatum',
                  ),
                }))
              }}
              error={dateErrors.startDate}
            />

            <DateInput
              label="Enddatum"
              value={endDate}
              minDate={toIsoDate(startDate) || today}
              onChange={handleEndDateChange}
              onBlur={() => {
                setDateErrors((currentErrors) => ({
                  ...currentErrors,
                  endDate: validateDate(
                    endDate,
                    'Enddatum',
                  ),
                }))
              }}
              error={dateErrors.endDate}
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