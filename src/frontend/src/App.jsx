import { useState } from 'react'
import { Box } from '@mui/material'

import AppLayout from './components/layout/AppLayout.jsx'
import HomePage from './pages/HomePage.jsx'
import LoanRequestPage from './pages/LoanRequestPage.jsx'
import GegenstandsUebersicht from './pages/GegenstandsUebersicht.jsx'
import GegenstandDetail from './pages/GegenstandDetail.jsx'

function App() {
  const [currentPage, setCurrentPage] = useState('home')
  const [selectedGegenstandId, setSelectedGegenstandId] = useState(null)

  function navigateTo(page) {
    if (page !== 'items') {
      setSelectedGegenstandId(null)
    }

    setCurrentPage(page)
  }

  let pageContent = <HomePage />

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
    >
      {pageContent}
    </AppLayout>
  )
}

export default App