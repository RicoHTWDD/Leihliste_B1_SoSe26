import { MenuItem, TextField } from '@mui/material'
import { fehlertext } from '../../utils/exemplarFelder.js'

export default function StandortFeld({ value, onChange, standorte = [], aktuellerName, error, disabled = false }) {
  const bisher = aktuellerName && aktuellerName !== 'Nicht zugewiesen' ? aktuellerName : ''
  const hinweis = [
    bisher ? `Bisheriger Standort: ${bisher}` : '',
    !standorte.length ? 'Zurzeit sind keine Standorte zur Auswahl verfügbar.' : '',
  ].filter(Boolean).join(' ')

  return (
    <TextField select required fullWidth label="Standort" value={value ?? ''}
      disabled={disabled} onChange={event => onChange(event.target.value)}
      error={Boolean(error)} helperText={fehlertext(error) || hinweis}>
      <MenuItem value=""><em>Bitte auswählen</em></MenuItem>
      {standorte.map(ort => (
        <MenuItem key={ort.id} value={ort.id}>{ort.name}</MenuItem>
      ))}
    </TextField>
  )
}