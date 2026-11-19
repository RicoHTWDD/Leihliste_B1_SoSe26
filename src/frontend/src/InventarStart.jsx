import { useEffect, useState } from 'react'
import { Alert, Button } from '@mui/material'
import App from './App.jsx'
import { apiRequest, listAll } from './utils/inventarApi.js'

const env = import.meta.env
const rechteUrl = env.VITE_INVENTAR_RECHTE_URL
const kategorienUrl = env.VITE_INVENTAR_KATEGORIEN_URL
const standorteUrl = env.VITE_INVENTAR_STANDORTE_URL

export default function InventarStart() {
  const [zugang, setZugang] = useState(null)
  const [versuch, setVersuch] = useState(0)
  const konfiguriert = Boolean(rechteUrl || kategorienUrl || standorteUrl)

  useEffect(() => {
    if (!konfiguriert) return
    const controller = new AbortController()
    const optionen = { signal: controller.signal }
    async function laden() {
      let erlaubt = env.DEV && env.VITE_INVENTAR_DEMO === 'true'
      if (rechteUrl) {
        const rechte = await apiRequest(rechteUrl, optionen)
        erlaubt = rechte?.canManageInventory === true
      }
      if (!erlaubt) return { erlaubt: false }
      const [kategorien, standorte] = await Promise.all([
        kategorienUrl ? listAll(kategorienUrl, optionen) : undefined,
        standorteUrl ? listAll(standorteUrl, optionen) : undefined,
      ])
      return { erlaubt, capabilities: { kategorien, standorte } }
    }
    laden().then(result => {
      if (!controller.signal.aborted) setZugang(result)
    }).catch(error => {
      if (!controller.signal.aborted) setZugang({ erlaubt: false, fehler: error.message })
    })
    return () => controller.abort()
  }, [konfiguriert, versuch])

  if (!konfiguriert) return <App />
  return (
    <>
      {zugang?.fehler && <Alert severity="warning" action={
        <Button onClick={() => { setZugang(null); setVersuch(alt => alt + 1) }}>Erneut laden</Button>
      }>Die Inventarverwaltung konnte nicht geladen werden. {zugang.fehler}</Alert>}
      <App canManageInventory={zugang?.erlaubt === true} capabilities={zugang?.capabilities} />
    </>
  )
}
