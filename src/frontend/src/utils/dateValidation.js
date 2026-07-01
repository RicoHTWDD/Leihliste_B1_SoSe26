export function getToday() {
  const today = new Date()

  today.setMinutes(
    today.getMinutes() - today.getTimezoneOffset(),
  )

  return today.toISOString().slice(0, 10)
}

export function validateDates(startDate, endDate) {
  const today = getToday()

  if (!startDate || !endDate) {
    return 'Bitte ein Start- und Enddatum auswählen.'
  }

  if (startDate < today || endDate < today) {
    return (
      'Start- und Enddatum dürfen nicht '
      + 'in der Vergangenheit liegen.'
    )
  }

  if (endDate < startDate) {
    return (
      'Das Enddatum darf nicht vor '
      + 'dem Startdatum liegen.'
    )
  }

  return ''
}