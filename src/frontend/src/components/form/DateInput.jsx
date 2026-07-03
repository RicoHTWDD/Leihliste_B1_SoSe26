import { useRef } from 'react'

import CalendarMonthOutlinedIcon
  from '@mui/icons-material/CalendarMonthOutlined'

import {
  Box,
  FormHelperText,
  IconButton,
  Typography,
} from '@mui/material'

function getDateParts(value) {
  const [day = '', month = '', year = ''] =
    value.split('.')

  return {
    day,
    month,
    year,
  }
}

function buildDateValue(day, month, year) {
  if (year) {
    return `${day}.${month}.${year}`
  }

  if (month) {
    return `${day}.${month}`
  }

  return day
}

function isoToGermanDate(value) {
  const [year, month, day] = value.split('-')

  return `${day}.${month}.${year}`
}

function germanToIsoDate(value) {
  const match = value.match(
    /^(\d{2})\.(\d{2})\.(\d{4})$/,
  )

  if (!match) {
    return ''
  }

  return `${match[3]}-${match[2]}-${match[1]}`
}

function DateInput({
  label,
  value,
  onChange,
  onBlur,
  error,
  minDate,
}) {
  const dayRef = useRef(null)
  const monthRef = useRef(null)
  const yearRef = useRef(null)
  const calendarRef = useRef(null)

  const {
    day,
    month,
    year,
  } = getDateParts(value)

  function moveCursorToEnd(input) {
    if (!input) {
      return
    }

    requestAnimationFrame(() => {
      const position = input.value.length

      input.setSelectionRange(
        position,
        position,
      )
    })
  }

  function focusInput(input) {
    if (!input) {
      return
    }

    input.focus()
    moveCursorToEnd(input)
  }

  function focusCurrentPart() {
    if (day.length < 2) {
      focusInput(dayRef.current)
      return
    }

    if (month.length < 2) {
      focusInput(monthRef.current)
      return
    }

    focusInput(yearRef.current)
  }

  function updatePart(part, inputValue) {
    const maxLength = part === 'year' ? 4 : 2

    const digits = inputValue
      .replace(/\D/g, '')
      .slice(0, maxLength)

    const nextDate = {
      day,
      month,
      year,
      [part]: digits,
    }

    onChange(
      buildDateValue(
        nextDate.day,
        nextDate.month,
        nextDate.year,
      ),
    )

    if (
      part === 'day'
      && digits.length === 2
    ) {
      focusInput(monthRef.current)
    }

    if (
      part === 'month'
      && digits.length === 2
    ) {
      focusInput(yearRef.current)
    }
  }

  function handleKeyDown(event, part) {
    if (event.key === 'Enter') {
      event.preventDefault()
      event.currentTarget.blur()
      return
    }

    if (
      event.key !== 'Backspace'
      || event.currentTarget.value !== ''
    ) {
      return
    }

    if (part === 'month') {
      event.preventDefault()
      focusInput(dayRef.current)
    }

    if (part === 'year') {
      event.preventDefault()
      focusInput(monthRef.current)
    }
  }

  function handleContainerBlur(event) {
    const nextElement = event.relatedTarget

    if (!event.currentTarget.contains(nextElement)) {
      onBlur?.()
    }
  }

  function openCalendar(event) {
    event.stopPropagation()

    const calendarInput = calendarRef.current

    if (!calendarInput) {
      return
    }

    if (
      typeof calendarInput.showPicker === 'function'
    ) {
      calendarInput.showPicker()
      return
    }

    calendarInput.click()
  }

  function handleCalendarChange(event) {
    if (!event.target.value) {
      return
    }

    onChange(
      isoToGermanDate(event.target.value),
    )
  }

  const inputStyles = {
    padding: 0,
    border: 0,
    outline: 0,
    backgroundColor: 'transparent',
    color: 'text.primary',
    font: 'inherit',
    textAlign: 'right',
    caretColor: 'text.primary',
    flexShrink: 0,

    '&::placeholder': {
      color: 'text.disabled',
      opacity: 1,
    },
  }

  return (
    <Box
      sx={{
        width: {
          xs: '100%',
          sm: 360,
        },
      }}
    >
      <Typography
        component="label"
        variant="body2"
        sx={{
          display: 'block',
          marginBottom: 0.5,
          color: error
            ? 'error.main'
            : 'text.secondary',
        }}
      >
        {label}
      </Typography>

      <Box
        onClick={focusCurrentPart}
        onBlur={handleContainerBlur}
        sx={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          minHeight: 56,
          paddingLeft: 1.75,
          paddingRight: 0.5,
          border: 1,
          borderColor: error
            ? 'error.main'
            : 'rgba(0, 0, 0, 0.23)',
          borderRadius: 1,
          backgroundColor: 'background.paper',
          cursor: 'text',

          '&:hover': {
            borderColor: error
              ? 'error.main'
              : 'text.primary',
          },

          '&:focus-within': {
            borderWidth: 2,
            borderColor: error
              ? 'error.main'
              : 'primary.main',
          },
        }}
      >
        <Box
          component="input"
          ref={dayRef}
          aria-label={`${label}: Tag`}
          placeholder="TT"
          inputMode="numeric"
          maxLength={2}
          value={day}
          onClick={(event) => {
            event.stopPropagation()
            moveCursorToEnd(event.currentTarget)
          }}
          onFocus={(event) => {
            moveCursorToEnd(event.currentTarget)
          }}
          onChange={(event) => {
            updatePart('day', event.target.value)
          }}
          onKeyDown={(event) => {
            handleKeyDown(event, 'day')
          }}
          sx={{
            ...inputStyles,
            width: '2.4ch',
            minWidth: '2.4ch',
          }}
        />

        <Typography
          component="span"
          aria-hidden="true"
          sx={{
            marginX: 0,
            flexShrink: 0,
          }}
        >
          .
        </Typography>

        <Box
          component="input"
          ref={monthRef}
          aria-label={`${label}: Monat`}
          placeholder="MM"
          inputMode="numeric"
          maxLength={2}
          value={month}
          onClick={(event) => {
            event.stopPropagation()
            moveCursorToEnd(event.currentTarget)
          }}
          onFocus={(event) => {
            moveCursorToEnd(event.currentTarget)
          }}
          onChange={(event) => {
            updatePart('month', event.target.value)
          }}
          onKeyDown={(event) => {
            handleKeyDown(event, 'month')
          }}
          sx={{
            ...inputStyles,
            width: '2.4ch',
            minWidth: '2.4ch',
          }}
        />

        <Typography
          component="span"
          aria-hidden="true"
          sx={{
            marginX: 0,
            flexShrink: 0,
          }}
        >
          .
        </Typography>

        <Box
          component="input"
          ref={yearRef}
          aria-label={`${label}: Jahr`}
          placeholder="JJJJ"
          inputMode="numeric"
          maxLength={4}
          value={year}
          onClick={(event) => {
            event.stopPropagation()
            moveCursorToEnd(event.currentTarget)
          }}
          onFocus={(event) => {
            moveCursorToEnd(event.currentTarget)
          }}
          onChange={(event) => {
            updatePart('year', event.target.value)
          }}
          onKeyDown={(event) => {
            handleKeyDown(event, 'year')
          }}
          sx={{
            ...inputStyles,
            width: '4.8ch',
            minWidth: '4.8ch',
          }}
        />

        <IconButton
          type="button"
          aria-label={`${label} im Kalender auswählen`}
          onMouseDown={(event) => {
            event.stopPropagation()
          }}
          onClick={openCalendar}
          sx={{
            position: 'relative',
            width: 48,
            height: 48,
            marginLeft: 'auto',
            flexShrink: 0,
          }}
        >
          <CalendarMonthOutlinedIcon />

          <Box
            component="input"
            ref={calendarRef}
            type="date"
            min={minDate}
            value={germanToIsoDate(value)}
            onChange={handleCalendarChange}
            tabIndex={-1}
            aria-hidden="true"
            sx={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              opacity: 0,
              pointerEvents: 'none',
            }}
          />
        </IconButton>
      </Box>

      <FormHelperText
        error={Boolean(error)}
        sx={{
          minHeight: 20,
          marginX: 1.75,
        }}
      >
        {error || ' '}
      </FormHelperText>
    </Box>
  )
}

export default DateInput