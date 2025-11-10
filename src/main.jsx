import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import RouterApp from './RouterApp.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <RouterApp />
    </ErrorBoundary>
  </StrictMode>,
)
