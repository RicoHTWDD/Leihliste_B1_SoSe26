import { useState } from 'react'
import {
  Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField,
} from '@mui/material'
import { ErrorMessage } from './ui'

export default function AnfrageEntscheidungsDialog({
  anfrage, aktion, speichert, fehler, onEingabe, onAbbrechen, onEntscheiden,
}) {
  const [grund, setGrund] = useState('')
  const ablehnen = aktion === 'ablehnen'
  const zuLang = Array.from(grund.trim()).length > 500
  const grundFehler = fehler?.fields?.ablehnungsgrund
  const feldmeldung = zuLang ? 'Bitte höchstens 500 Zeichen eingeben.'
    : Array.isArray(grundFehler) ? grundFehler[0] : grundFehler

  return (
    <Dialog open fullWidth maxWidth="xs" onClose={speichert ? undefined : onAbbrechen}
      aria-labelledby="entscheidung-titel" aria-describedby="entscheidung-frage">
      <DialogTitle id="entscheidung-titel">
        {ablehnen ? 'Anfrage ablehnen?' : 'Anfrage bestätigen?'}
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="entscheidung-frage">
          Möchtest du die Anfrage #{anfrage.id} von {anfrage.nutzer_name} für {anfrage.gegenstand_name}
          {ablehnen ? ' wirklich ablehnen?' : ' wirklich bestätigen?'}
        </DialogContentText>
        {ablehnen && (
          <TextField label="Ablehnungsgrund (optional)" multiline minRows={2} fullWidth
            sx={{ mt: 2 }} disabled={speichert} value={grund}
            onChange={event => {
              setGrund(event.target.value)
              if (fehler) onEingabe()
            }}
            error={Boolean(feldmeldung)} helperText={feldmeldung || 'Bis zu 500 Zeichen.'} />
        )}
        {fehler && !grundFehler && <ErrorMessage message={fehler.message} />}
      </DialogContent>
      <DialogActions>
        <Button autoFocus disabled={speichert} onClick={onAbbrechen}>Abbrechen</Button>
        <Button variant="contained" color={ablehnen ? 'error' : 'primary'}
          disabled={speichert || zuLang} onClick={() => onEntscheiden(grund)}>
          {speichert ? 'Wird gespeichert …' : ablehnen ? 'Ablehnen' : 'Bestätigen'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
