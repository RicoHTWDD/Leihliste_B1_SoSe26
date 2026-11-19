import { useEffect, useState } from 'react'

export function useAnfragedaten(laden, schluessel) {
  const [versuch, setVersuch] = useState(0)
  const [antwort, setAntwort] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    laden(schluessel, { signal: controller.signal }).then(
      daten => {
        if (!controller.signal.aborted) setAntwort({ schluessel, versuch, daten })
      },
      fehler => {
        if (!controller.signal.aborted) {
          setAntwort({ schluessel, versuch, fehler: fehler.message || 'Die Anfrage konnte nicht geladen werden.' })
        }
      },
    )
    return () => controller.abort()
  }, [laden, schluessel, versuch])

  const aktuell = antwort && antwort.schluessel === schluessel && antwort.versuch === versuch ? antwort : null
  return { antwort: aktuell, erneutLaden: () => setVersuch(wert => wert + 1) }
}

const datumDeutsch = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit', month: '2-digit', year: 'numeric',
})

export function formatiereDatum(wert) {
  if (!wert) return '–'
  // Ein Django-DateField enthält einen Kalendertag ohne Zeitzone.
  const tag = /^(\d{4})-(\d{2})-(\d{2})$/.exec(wert)
  if (tag) return tag[3] + '.' + tag[2] + '.' + tag[1]
  const datum = new Date(wert)
  return Number.isNaN(datum.getTime()) ? '–' : datumDeutsch.format(datum)
}
