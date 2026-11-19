import { useRef, useState } from 'react'
import {
  Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
} from '@mui/material'

export default function LoeschDialog({
  titel, hinweis, onAbbrechen, onBestaetigen,
  aktion = 'Löschen', fortschritt = 'Wird gelöscht …',
}) {
  const [wartet, setWartet] = useState(false)
  const [fehler, setFehler] = useState('')
  const ausgeloest = useRef(false)

  async function bestaetigen() {
    if (ausgeloest.current) return
    ausgeloest.current = true
    setWartet(true)
    setFehler('')
    try {
      await onBestaetigen()
    } catch (err) {
      setFehler(err.message || 'Die Aktion konnte nicht abgeschlossen werden.')
    } finally {
      ausgeloest.current = false
      setWartet(false)
    }
  }

  return (
    <Dialog open onClose={() => { if (!ausgeloest.current) onAbbrechen() }}
      aria-labelledby="loeschdialog-titel" aria-describedby={hinweis ? 'loeschdialog-hinweis' : undefined}>
      <DialogTitle id="loeschdialog-titel" sx={{ overflowWrap: 'anywhere' }}>{titel}</DialogTitle>
      {(hinweis || fehler) && (
        <DialogContent>
          {hinweis && <DialogContentText id="loeschdialog-hinweis">{hinweis}</DialogContentText>}
          {fehler && <Alert severity="error">{fehler}</Alert>}
        </DialogContent>
      )}
      <DialogActions>
        <Button autoFocus disabled={wartet} onClick={onAbbrechen}>Abbrechen</Button>
        <Button variant="contained" color="error" disabled={wartet} onClick={bestaetigen}>
          {wartet ? fortschritt : aktion}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
