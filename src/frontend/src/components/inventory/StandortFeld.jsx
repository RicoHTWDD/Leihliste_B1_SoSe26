import { MenuItem, TextField } from '@mui/material'
import { fehlertext } from '../../utils/exemplarFelder.js'

export default function StandortFeld({ value, onChange, standorte = [], aktuellerName, error, disabled = false }) {
  // Das Detail liefert den Namen. Ohne neue Auswahl bleibt der gespeicherte Fremdschlüssel erhalten.
  const bisher = aktuellerName && aktuellerName !== 'Nicht zugewiesen' ? aktuellerName : ''
  const hinweis = !standorte.length ? 'Zurzeit sind keine Standorte zur Auswahl verfügbar.' : ''
  return (
    <TextField select required fullWidth label="Standort" value={value ?? ''}
      disabled={disabled} onChange={event => onChange(event.target.value)}
      error={Boolean(error)} helperText={fehlertext(error) || hinweis}
      slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}>
      <MenuItem value="" disabled={!bisher}>{bisher ? bisher + ' (beibehalten)' : 'Standort auswählen'}</MenuItem>
      {standorte.map(ort => (
        <MenuItem key={ort.id} value={ort.id}>{ort.name}</MenuItem>
      ))}
    </TextField>
  )
}
