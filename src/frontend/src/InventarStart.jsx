import { useEffect, useState } from 'react'
import { Alert, Button } from '@mui/material'
import App from './App.jsx'
import { apiRequest, listAll } from './utils/inventarApi.js'
import { referenzbereiche } from './utils/referenzbereiche.js'

const env = import.meta.env
const rechteUrl = env.VITE_INVENTAR_RECHTE_URL
const demo = env.DEV && env.VITE_INVENTAR_DEMO === 'true'
const auswahlquellen = [
  [referenzbereiche.categories, rechteUrl || env.VITE_INVENTAR_KATEGORIEN_URL],
  [referenzbereiche.locations, rechteUrl || env.VITE_INVENTAR_STANDORTE_URL],
].filter(([, laden]) => laden).map(([bereich]) => bereich)

export default function InventarStart() {
  const [zugang, setZugang] = useState(null)
  const [versuch, setVersuch] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    const optionen = { signal: controller.signal }
    async function laden() {
      const erlaubt = rechteUrl
        ? (await apiRequest(rechteUrl, optionen))?.canManageInventory === true
        : demo
      if (controller.signal.aborted) return
      setZugang({ erlaubt, capabilities: {}, fehlend: [] })
      if (!erlaubt) return

      // Die Freigabe hängt nicht von der Ladezeit der beiden Auswahllisten ab.
      // Ohne #47-Endpunkt nutzt #33 seine bisherige Auswahl.
      await Promise.all(auswahlquellen.map(async ({ art, liste, url }) => {
        try {
          const daten = await listAll(url, optionen)
          if (!controller.signal.aborted) setZugang(alt => ({
            ...alt,
            capabilities: { [liste]: daten, ...alt.capabilities },
          }))
        } catch (fehler) {
          if (!controller.signal.aborted && fehler.status !== 404) {
            setZugang(alt => ({ ...alt, fehlend: [...alt.fehlend, art] }))
          }
        }
      }))
    }
    laden().catch(error => {
      if (!controller.signal.aborted) setZugang({ erlaubt: false, fehler: error.message })
    })
    return () => controller.abort()
  }, [versuch])

  function auswahlAktualisieren(bereich, daten) {
    setZugang(alt => alt?.erlaubt ? {
      ...alt,
      capabilities: { ...alt.capabilities, [bereich.liste]: daten },
      fehlend: alt.fehlend.filter(art => art !== bereich.art),
    } : alt)
  }

  const warnung = zugang?.fehler
    ? 'Die Inventarberechtigung konnte nicht geladen werden. ' + zugang.fehler
    : zugang?.fehlend?.length && 'Auswahlliste nicht verfügbar: ' + zugang.fehlend.join(', ') + '.'
  return (
    <>
      {warnung ? <Alert severity="warning" action={
        <Button onClick={() => setVersuch(alt => alt + 1)}>Erneut laden</Button>
      }>{warnung}</Alert> : null}
      <App canManageInventory={zugang?.erlaubt === true} capabilities={zugang?.capabilities}
        darfReferenzdatenVerwalten={Boolean(rechteUrl) && zugang?.erlaubt === true}
        onReferenzdatenGespeichert={auswahlAktualisieren} />
    </>
  )
}
