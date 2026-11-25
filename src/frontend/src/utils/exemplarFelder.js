export const zustaende = {
  neu: 'Neu',
  gut: 'Gut',
  beschaedigt: 'Beschädigt',
  defekt: 'Defekt',
  verloren: 'Verloren',
}

export const verfuegbarkeiten = {
  verfuegbar: 'Verfügbar',
  nicht_verfuegbar: 'Nicht verfügbar',
}

export function neuesExemplar(quelle = {}) {
  return {
    inventarnummer: quelle?.inventarnummer ?? '',
    zustand: quelle?.zustand ?? 'gut',
    verfuegbarkeitsstatus: quelle?.verfuegbarkeitsstatus ?? 'verfuegbar',
  }
}

export function pruefeExemplar(werte) {
  const fehler = {}
  const nummer = werte.inventarnummer.trim()
  if (!nummer) {
    fehler.inventarnummer = 'Bitte eine Inventarnummer angeben.'
  } else if ([...nummer].length > 255) {
    fehler.inventarnummer = 'Die Inventarnummer darf höchstens 255 Zeichen haben.'
  }

  if (!Object.hasOwn(zustaende, werte.zustand)) {
    fehler.zustand = 'Bitte einen Zustand auswählen.'
  }
  if (!Object.hasOwn(verfuegbarkeiten, werte.verfuegbarkeitsstatus)) {
    fehler.verfuegbarkeitsstatus = 'Bitte einen Verfügbarkeitsstatus auswählen.'
  } else if (['defekt', 'verloren'].includes(werte.zustand) &&
      werte.verfuegbarkeitsstatus === 'verfuegbar') {
    fehler.verfuegbarkeitsstatus = 'Ein defektes oder verlorenes Exemplar kann nicht verfügbar sein.'
  }
  return fehler
}

export function fehlertext(meldung) {
  if (Array.isArray(meldung)) return meldung.filter((text) => typeof text === 'string').join(' ')
  return typeof meldung === 'string' ? meldung : ''
}
