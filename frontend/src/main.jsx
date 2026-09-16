import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { CartProvider } from './cart.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { clearSession, setUnauthorizedHandler } from './api.js'
import './index.css'

// Expired or revoked tokens should land on the PIN screen, never a blank page.
setUnauthorizedHandler(() => {
  if (window.location.pathname !== '/login') {
    clearSession()
    window.location.assign('/login')
  }
})

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <CartProvider>
          <App />
        </CartProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
)
