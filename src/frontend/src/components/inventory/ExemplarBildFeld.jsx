import { useEffect, useId, useRef } from 'react'
import { Button, FormHelperText, Stack, Typography } from '@mui/material'
import { bildAdresse } from '../../utils/bildAdresse.js'

const bildStil = { objectFit: 'contain', maxWidth: '100%' }

function Vorschau({ datei }) {
  const element = useRef(null)
  useEffect(() => {
    const url = URL.createObjectURL(datei)
    element.current.src = url
    return () => URL.revokeObjectURL(url)
  }, [datei])

  return <img ref={element} width="180" height="140" style={bildStil} alt={'Vorschau: ' + datei.name} />
}

export default function ExemplarBildFeld({ bild, gespeichert, fehler, disabled, onChange }) {
  const id = useId()
  const eingabe = useRef(null)
  const gespeicherteAdresse = bildAdresse(gespeichert)

  useEffect(() => {
    if (!bild) eingabe.current.value = ''
  }, [bild])

  return (
    <Stack spacing={1} alignItems="flex-start">
      <Typography component="label" htmlFor={id}>Bild (optional)</Typography>
      <input ref={eingabe} id={id} type="file" name="bild" accept="image/jpeg,image/png,.jpg,.jpeg,.png"
        disabled={disabled} aria-invalid={Boolean(fehler)} aria-describedby={id + '-hilfe'}
        onChange={event => {
          const datei = event.target.files[0]
          if (datei) onChange(datei)
        }} />
      <FormHelperText id={id + '-hilfe'} error={Boolean(fehler)} aria-live="polite">
        {fehler || 'JPG oder PNG, maximal 200 kB.'}
      </FormHelperText>
      {bild && !fehler && <Vorschau datei={bild} />}
      {gespeicherteAdresse && (bild === undefined || (bild && fehler)) && (
        <img src={gespeicherteAdresse} width="180" height="140" style={bildStil} alt="Gespeichertes Exemplarbild" />
      )}
      {bild && (
        <Button type="button" size="small" disabled={disabled} onClick={() => onChange(undefined)}>
          Auswahl verwerfen
        </Button>
      )}
      {gespeicherteAdresse && bild === undefined && (
        <Button type="button" size="small" disabled={disabled} onClick={() => onChange(null)}>Bild entfernen</Button>
      )}
      {bild === null && (
        <>
          <Typography variant="body2">Das Bild wird beim Speichern entfernt.</Typography>
          <Button type="button" size="small" disabled={disabled} onClick={() => onChange(undefined)}>
            Entfernen rückgängig machen
          </Button>
        </>
      )}
    </Stack>
  )
}
