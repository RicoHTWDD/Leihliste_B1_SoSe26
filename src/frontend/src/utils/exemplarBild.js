const maximaleBildgroesse = 200 * 1024

export function pruefeBild(bild) {
  if (!bild) return ''
  const endungPasst = /\.(jpe?g|png)$/i.test(bild.name)
  const istBild = !bild.type || ['image/jpeg', 'image/png'].includes(bild.type)
  if (!endungPasst || !istBild) return 'Nur Bilder im Format JPG oder PNG sind erlaubt.'
  if (bild.size > maximaleBildgroesse) return 'Das Bild darf höchstens 200 kB groß sein.'
  return ''
}

// undefined behält das gespeicherte Bild, null entfernt es beim Speichern.
export function exemplarAnfrage(daten, bild) {
  if (bild === undefined) return daten
  if (bild === null) return { ...daten, bild: null }

  const form = new FormData()
  for (const [feld, wert] of Object.entries(daten)) {
    form.append(feld, String(wert))
  }
  form.append('bild', bild, bild.name)
  return form
}
