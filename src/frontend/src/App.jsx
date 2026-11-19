import { useState } from 'react'
import { Alert, Box, Button } from '@mui/material'

import AppLayout from './components/layout/AppLayout.jsx'
import HomePage from './pages/HomePage.jsx'
import LoanRequestPage from './pages/LoanRequestPage.jsx'
import GegenstandsUebersicht from './pages/GegenstandsUebersicht.jsx'
import GegenstandDetail from './pages/GegenstandDetail.jsx'
import EingegangeneAnfragen from './pages/EingegangeneAnfragen.jsx'
import { useAnfragedaten } from './pages/anfrageAnsicht.js'
import { istAnfragenDemo, ladeEingangsrecht } from './utils/eingegangeneAnfragenApi.js'

function App({ darfEingegangeneAnfragenSehen }) {
  const [currentPage, setCurrentPage] = useState('home')
  const [selectedGegenstandId, setSelectedGegenstandId] = useState(null)
  const [anfrageId, setAnfrageId] = useState(null)
  const [datenstand, setDatenstand] = useState(0)
  const { antwort: recht, erneutLaden: rolleNeuLaden } = useAnfragedaten(ladeEingangsrecht, darfEingegangeneAnfragenSehen)
  const eingangSichtbar = recht?.daten === true

  function navigateTo(page) {
    if (page === 'eingang' && !eingangSichtbar) return
    setAnfrageId(null)
    setSelectedGegenstandId(null)
    setCurrentPage(page)
  }

  let pageContent = (
    <HomePage datenstand={datenstand}
      onEingangOeffnen={currentPage === 'home' && eingangSichtbar ? () => navigateTo('eingang') : undefined} />
  )

  if (currentPage === 'eingang' && eingangSichtbar) {
    pageContent = (
      <>
        {istAnfragenDemo && <Alert severity="info" sx={{ mb: 2 }}>Lokale Demo mit Testanfragen</Alert>}
        <EingegangeneAnfragen auswahl={anfrageId} onAuswahl={setAnfrageId}
          onBestandGeaendert={() => setDatenstand(stand => stand + 1)} />
      </>
    )
  }

  if (currentPage === 'items') {
    pageContent = (
      <>
        {/* Übersicht bleibt geladen, damit Suche und Filter erhalten bleiben */}
        <Box
          sx={{
            display: selectedGegenstandId === null ? 'block' : 'none',
          }}
        >
          <GegenstandsUebersicht
            onSelectGegenstand={setSelectedGegenstandId}
            onAddAusleihe={() => navigateTo('loan-request')}
          />
        </Box>

        {/* Detailansicht des ausgewählten Exemplars */}
        {selectedGegenstandId !== null && (
          <GegenstandDetail
            gegenstandId={selectedGegenstandId}
            onBack={() => setSelectedGegenstandId(null)}
          />
        )}
      </>
    )
  }

  if (currentPage === 'loan-request') {
    pageContent = <LoanRequestPage />
  }

  return (
    <AppLayout
      currentPage={currentPage}
      onNavigate={navigateTo}
      eingangSichtbar={eingangSichtbar}
    >
      {currentPage === 'home' && recht?.fehler && (
        <Alert severity="warning" sx={{ mb: 2 }} action={<Button onClick={rolleNeuLaden}>Erneut versuchen</Button>}>
          Die Benutzerrolle konnte nicht geladen werden.
        </Alert>
      )}
      {pageContent}
    </AppLayout>
  )
}

export default App
