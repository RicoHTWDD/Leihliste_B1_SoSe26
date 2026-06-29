import { useState } from 'react'
import AppLayout from './components/layout/AppLayout.jsx'
import HomePage from './pages/HomePage.jsx'
import GegenstandUebersicht from './pages/GegenstandUebersicht.jsx'
import GegenstandDetail from './pages/GegenstandDetail.jsx'
import MeineAnfragen from './pages/MeineAnfragen.jsx'
import LoanRequestPage from './pages/LoanRequestPage.jsx'

function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [overlay, setOverlay] = useState(null) // null | {type:'detail', id} | {type:'form'}

  function navigate(tab) {
    setOverlay(null)
    setActiveTab(tab)
  }

  let pageContent
  if (overlay?.type === 'detail') {
    pageContent = (
      <GegenstandDetail
        gegenstandId={overlay.id}
        onBack={() => setOverlay(null)}
      />
    )
  } else if (overlay?.type === 'form') {
    pageContent = <LoanRequestPage onBack={() => setOverlay(null)} />
  } else if (activeTab === 'items') {
    pageContent = (
      <GegenstandUebersicht
        onSelectGegenstand={(id) => setOverlay({ type: 'detail', id })}
      />
    )
  } else if (activeTab === 'loan-request') {
    pageContent = (
      <MeineAnfragen onNeueAnfrage={() => setOverlay({ type: 'form' })} />
    )
  } else {
    pageContent = <HomePage />
  }

  return (
    <AppLayout currentPage={activeTab} onNavigate={navigate}>
      {pageContent}
    </AppLayout>
  )
}

export default App