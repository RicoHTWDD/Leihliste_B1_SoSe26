import { Box } from '@mui/material'

import Header from './Header.jsx'
import Sidebar from './Sidebar.jsx'

function AppLayout({children, currentPage, onNavigate,}) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
      }}
    >
      <Header />

      <Box
        sx={{
          display: 'flex',
        }}
      >
        <Sidebar
          currentPage={currentPage}
          onNavigate={onNavigate}
        />

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            minWidth: 0,
            padding: 3,
          }}
        >
          <Box
            sx={{
              width: '100%',
              maxWidth: 1200,
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default AppLayout