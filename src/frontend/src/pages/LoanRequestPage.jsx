import { useEffect, useState } from 'react'

import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Divider,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from '@mui/material'

import ErrorMessage from '../components/ui/ErrorMessage.jsx'
import HintBox from '../components/ui/HintBox.jsx'
import StatusBadge from '../components/ui/StatusBadge.jsx'

// ---------------------------------------------------------------------------
// Datenquelle (identisch zur Gegenstandsübersicht).
// GET /api/inventory/alle-exemplare/ — DRF-paginiert: { ..., results: [...] }.
// Idealerweise später in ein gemeinsames Modul (z. B. src/api/gegenstaende.js)
// auslagern, damit Übersicht und Formular dieselbe Funktion nutzen.
// ---------------------------------------------------------------------------
async function fetchGegenstaende() {
  const res = await fetch('/api/inventory/alle-exemplare/')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()

  return data.results.map((exemplar) => ({
    id: exemplar.id,
    name: exemplar.name,
    status: exemplar.verfuegbarkeitsstatus, // 'verfuegbar' | 'nicht_verfuegbar'
    available: exemplar.verfuegbarkeitsstatus === 'verfuegbar',
  }))
}

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

function LoanRequestPage({ onBack }) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedItems, setSelectedItems] = useState([])
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')

  // Gegenstände vom Backend laden
  const [items, setItems] = useState([])
  const [loadStatus, setLoadStatus] = useState('loading') // 'loading' | 'done' | 'error'

  useEffect(() => {
    let active = true
    setLoadStatus('loading')
    fetchGegenstaende()
      .then((data) => {
        if (!active) return
        setItems(data)
        setLoadStatus('done')
      })
      .catch(() => {
        if (active) setLoadStatus('error')
      })
    return () => {
      active = false
    }
  }, [])

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

    // API-Anbindung (Anfrage absenden) kommt später hier hinein.
  }

  function handleReset() {
    setStartDate('')
    setEndDate('')
    setSelectedItems([])
    setComment('')
    setError('')
    onBack?.() // Formular schließen und zurück zur vorigen Ansicht
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

          {loadStatus === 'loading' && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress />
            </Box>
          )}

          {loadStatus === 'error' && (
            <ErrorMessage message="Die Gegenstände konnten nicht geladen werden." />
          )}

          {loadStatus === 'done' && items.length === 0 && (
            <HintBox message="Keine Gegenstände vorhanden." />
          )}

          {loadStatus === 'done'
            && items.map((item) => (
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

                <StatusBadge status={item.status} />
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