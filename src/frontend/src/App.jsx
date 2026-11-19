import { lazy, Suspense, useState } from 'react'
import { Alert, Box, Button, CircularProgress } from '@mui/material'

import AppLayout from './components/layout/AppLayout.jsx'
import LoeschDialog from './components/ui/LoeschDialog.jsx'
import HomePage from './pages/HomePage.jsx'
import LoanRequestPage from './pages/LoanRequestPage.jsx'
import GegenstandsUebersicht from './pages/GegenstandsUebersicht.jsx'
import GegenstandDetail from './pages/GegenstandDetail.jsx'
import GegenstandstypDetail from './pages/GegenstandstypDetail.jsx'
import { apiRequest } from './utils/inventarApi.js'
import { referenzbereiche } from './utils/referenzbereiche.js'

const ExemplarFormular = lazy(() => import('./pages/ExemplarFormular.jsx'))
const GegenstandstypFormular = lazy(() => import('./pages/GegenstandstypFormular.jsx'))

const ReferenzdatenVerwaltung = lazy(() => import('./pages/ReferenzdatenVerwaltung.jsx'))

const demoFreigabe = import.meta.env.DEV && import.meta.env.VITE_INVENTAR_DEMO === 'true'
const inventarliste = { page: 'items' }
const keineZusatzfunktionen = {}

function App({
  canManageInventory = demoFreigabe, capabilities = keineZusatzfunktionen,
  darfReferenzdatenVerwalten = false, onReferenzdatenGespeichert,
}) {
  const [verlauf, setVerlauf] = useState([{ page: 'home' }])
  const [refreshKey, setRefreshKey] = useState(0)
  const [erfolg, setErfolg] = useState(null)
  const [loeschziel, setLoeschziel] = useState(null)
  const aktuell = verlauf.at(-1)
  const darfVerwalten = canManageInventory === true

  function navigateTo(page) {
    setErfolg(null)
    setLoeschziel(null)
    setVerlauf([{ page }])
  }

  function oeffnen(page, id, daten) {
    setErfolg(null)
    setVerlauf((bisher) => [...bisher, { page, id, daten }])
  }

  function zurueck() {
    setErfolg(null)
    setVerlauf((bisher) => bisher.length > 1 ? bisher.slice(0, -1) : [inventarliste])
  }

  function gespeichert(art, daten) {
    const bearbeitet = Boolean(aktuell.daten)
    const ansicht = art === 'Exemplar' ? 'exemplar' : 'typ'
    const name = art === 'Exemplar' ? daten.inventarnummer : daten.name
    setRefreshKey((wert) => wert + 1)
    setErfolg({
      text: art + ' „' + name + '“ wurde ' + (bearbeitet ? 'gespeichert.' : 'angelegt.'),
      ziel: bearbeitet ? null : { ansicht, id: daten.id, label: art + ' anzeigen' },
    })
    setVerlauf((bisher) => {
      if (bisher.at(-1) !== aktuell) return bisher
      return bearbeitet ? bisher.slice(0, -1) : [inventarliste]
    })
  }

  async function loeschen() {
    const { pfad, titel } = loeschziel
    await apiRequest(pfad, { method: 'DELETE' })
    setLoeschziel(null)
    setRefreshKey((wert) => wert + 1)
    setVerlauf([inventarliste])
    setErfolg({ text: titel + ' wurde gelöscht.' })
  }

  const ausInventar = verlauf.some((seite) => seite.page === 'items')
  let inhalt = null
  switch (aktuell.page) {
    case 'categories':
    case 'locations': {
      if (!darfReferenzdatenVerwalten) {
        inhalt = <Alert severity="warning">Für diese Aktion fehlt die Berechtigung.</Alert>
        break
      }
      const bereich = referenzbereiche[aktuell.page]
      inhalt = (
        <ReferenzdatenVerwaltung key={aktuell.page} art={bereich.art} url={bereich.url}
          onGespeichert={liste => onReferenzdatenGespeichert?.(bereich, liste)} />
      )
      break
    }
    case 'items':
      break
    case 'exemplar':
      inhalt = (
        <GegenstandDetail
          key={aktuell.id}
          gegenstandId={aktuell.id}
          onBack={zurueck}
          onTypAnzeigen={(id, exemplar) => oeffnen('typ', id, exemplar)}
          canManageInventory={darfVerwalten}
          onBearbeiten={(daten) => oeffnen('exemplar-formular', daten.id, daten)}
          onLoeschen={(daten) => setLoeschziel({
            pfad: '/api/inventory/exemplare/' + daten.id + '/',
            titel: 'Exemplar „' + daten.inventarnummer + '“',
          })}
        />
      )
      break
    case 'typ':
      inhalt = (
        <GegenstandstypDetail
          key={aktuell.id}
          typId={aktuell.id}
          exemplar={aktuell.daten}
          onBack={zurueck}
          onExemplarAnzeigen={(id) => oeffnen('exemplar', id)}
          canManageInventory={darfVerwalten}
          capabilities={capabilities}
          onBearbeiten={(daten) => oeffnen('typ-formular', daten.id, daten)}
          onLoeschen={(daten) => setLoeschziel({
            pfad: '/api/inventory/typen/' + daten.id + '/',
            titel: 'Gegenstandstyp „' + daten.name + '“',
            hinweis: 'Alle zugehörigen Exemplare werden ebenfalls gelöscht.',
          })}
        />
      )
      break
    case 'exemplar-formular':
    case 'typ-formular': {
      if (!darfVerwalten) {
        inhalt = <Alert severity="warning">Für diese Aktion fehlt die Berechtigung.</Alert>
        break
      }
      const istExemplar = aktuell.page === 'exemplar-formular'
      const Formular = istExemplar ? ExemplarFormular : GegenstandstypFormular
      inhalt = (
        <Formular
          key={aktuell.page + '-' + (aktuell.id ?? 'neu')}
          initialData={aktuell.daten ?? null}
          capabilities={capabilities}
          onAbbrechen={zurueck}
          onSaved={(daten) => gespeichert(istExemplar ? 'Exemplar' : 'Gegenstandstyp', daten)}
        />
      )
      break
    }
    case 'loan-request':
      inhalt = <LoanRequestPage />
      break
    default:
      inhalt = (
        <HomePage
          canManageInventory={darfVerwalten}
          darfReferenzdatenVerwalten={darfReferenzdatenVerwalten}
          onKategorienAnzeigen={() => navigateTo('categories')}
          onStandorteAnzeigen={() => navigateTo('locations')}
          onInventarAnzeigen={() => navigateTo('items')}
          onExemplarAnlegen={() => oeffnen('exemplar-formular')}
          onTypAnlegen={() => oeffnen('typ-formular')}
        />
      )
  }

  return (
    <AppLayout currentPage={verlauf[0].page} onNavigate={navigateTo} darfReferenzdatenVerwalten={darfReferenzdatenVerwalten}>
      {erfolg && (
        <Alert severity="success" role="status" sx={{ mb: 2 }} onClose={() => setErfolg(null)}>
          {erfolg.text}
          {erfolg.ziel && (
            <Button size="small" onClick={() => oeffnen(erfolg.ziel.ansicht, erfolg.ziel.id)}>
              {erfolg.ziel.label}
            </Button>
          )}
        </Alert>
      )}
      {ausInventar && (
        <Box sx={{ display: aktuell.page === 'items' ? 'block' : 'none' }}>
          <GegenstandsUebersicht
            refreshKey={refreshKey}
            onSelectGegenstand={(id) => oeffnen('exemplar', id)}
            onAddAusleihe={() => navigateTo('loan-request')}
          />
        </Box>
      )}
      <Suspense fallback={<CircularProgress aria-label="Formular wird geladen" />}>
        {inhalt}
      </Suspense>
      {darfVerwalten && loeschziel && (
        <LoeschDialog
          titel={loeschziel.titel + ' löschen?'}
          hinweis={loeschziel.hinweis}
          onAbbrechen={() => setLoeschziel(null)}
          onBestaetigen={loeschen}
        />
      )}
    </AppLayout>
  )
}

export default App
