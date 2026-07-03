const DATE_PATTERN =
  /^(\d{2})\.(\d{2})\.(\d{4})$/

function parseDate(value) {
  const match = value.match(DATE_PATTERN)

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

export function getTodayIso() {
  const today = new Date()

  const year = today.getFullYear()
  const month = String(
    today.getMonth() + 1,
  ).padStart(2, '0')
  const day = String(
    today.getDate(),
  ).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function toIsoDate(value) {
  const match = value.match(DATE_PATTERN)

  if (!match) {
    return ''
  }

  return `${match[3]}-${match[2]}-${match[1]}`
}

export function validatePartialDate(value) {
  const [
    day = '',
    month = '',
    year = '',
  ] = value.split('.')

  if (day.length === 2) {
    const dayNumber = Number(day)

    if (dayNumber < 1 || dayNumber > 31) {
      return 'Der Tag muss zwischen 01 und 31 liegen.'
    }
  }

  if (month.length === 2) {
    const monthNumber = Number(month)

    if (
      monthNumber < 1
      || monthNumber > 12
    ) {
      return 'Der Monat muss zwischen 01 und 12 liegen.'
    }
  }

  if (year.length > 4) {
    return 'Das Jahr darf nur vier Ziffern enthalten.'
  }

  return ''
}

export function validateDate(value, label) {
  const digits = value.replace(/\D/g, '')

  if (!digits) {
    return `Bitte ein ${label} eingeben.`
  }

  const partialError =
    validatePartialDate(value)

  if (partialError) {
    return partialError
  }

  if (!DATE_PATTERN.test(value)) {
    return 'Bitte das Datum vollständig eingeben.'
  }

  const date = parseDate(value)

  if (!date) {
    return 'Das eingegebene Datum existiert nicht.'
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (date < today) {
    return (
      `Das ${label} darf nicht in `
      + 'der Vergangenheit liegen.'
    )
  }

  return ''
}

export function validateDateRange(
  startDate,
  endDate,
) {
  const errors = {
    startDate: validateDate(
      startDate,
      'Startdatum',
    ),
    endDate: validateDate(
      endDate,
      'Enddatum',
    ),
  }

  if (errors.startDate || errors.endDate) {
    return errors
  }

  if (
    parseDate(endDate) < parseDate(startDate)
  ) {
    errors.endDate =
      'Das Enddatum darf nicht vor dem Startdatum liegen.'
  }

  return errors
}