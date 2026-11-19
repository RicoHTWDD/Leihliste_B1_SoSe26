export const referenzbereiche = {
  categories: {
    art: 'Kategorie',
    liste: 'kategorien',
    url: import.meta.env.VITE_INVENTAR_KATEGORIEN_URL || '/api/inventory/kategorien/',
  },
  locations: {
    art: 'Standort',
    liste: 'standorte',
    url: import.meta.env.VITE_INVENTAR_STANDORTE_URL || '/api/inventory/standorte/',
  },
}

export function mitGespeichertemEintrag(liste, eintrag) {
  const index = liste.findIndex(element => String(element.id) === String(eintrag.id))
  if (index < 0) return [...liste, eintrag]
  return liste.map((element, position) => position === index ? eintrag : element)
}
