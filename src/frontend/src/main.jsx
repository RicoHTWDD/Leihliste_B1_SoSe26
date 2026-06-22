import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {CssBaseline, ThemeProvider} from "@mui/material"

import App from "./App.jsx"
import theme from "./theme/theme.js"

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>,
)
