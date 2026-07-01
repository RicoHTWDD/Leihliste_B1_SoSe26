import { useState } from 'react'

import AppLayout from './components/layout/AppLayout.jsx'
import HomePage from './pages/HomePage.jsx'
import LoanRequestPage from './pages/LoanRequestPage.jsx'

function App() {
  const [currentPage, setCurrentPage] = useState('home')

  let pageContent = <HomePage />

  if (currentPage === 'loan-request') {
    pageContent = <LoanRequestPage />
  }

  return (
    <AppLayout
      currentPage={currentPage}
      onNavigate={setCurrentPage}
    >
      {pageContent}
    </AppLayout>
  )
}

export default App