import { MenuItem, Stack, TextField } from '@mui/material'
import { fehlertext, verfuegbarkeiten, zustaende } from '../../utils/exemplarFelder.js'

export default function ExemplarFelder({ value, onChange, errors = {}, disabled = false }) {
  function feld(name) {
    const meldung = fehlertext(errors[name])
    return {
      name,
      value: value[name],
      required: true,
      fullWidth: true,
      disabled,
      error: Boolean(meldung),
      helperText: meldung,
      onChange: (event) => onChange(name, event.target.value),
    }
  }

  return (
    <Stack spacing={2}>
      <TextField label="Inventarnummer" {...feld('inventarnummer')}
        slotProps={{ htmlInput: { maxLength: 255 } }} />

      <TextField select label="Zustand" {...feld('zustand')}>
        <MenuItem value=""><em>Bitte auswählen</em></MenuItem>
        {Object.entries(zustaende).map(([wert, label]) =>
          <MenuItem key={wert} value={wert}>{label}</MenuItem>
        )}
      </TextField>

      <TextField select label="Verfügbarkeitsstatus" {...feld('verfuegbarkeitsstatus')}>
        <MenuItem value=""><em>Bitte auswählen</em></MenuItem>
        {Object.entries(verfuegbarkeiten).map(([wert, label]) =>
          <MenuItem key={wert} value={wert}>{label}</MenuItem>
        )}
      </TextField>
    </Stack>
  )
}
