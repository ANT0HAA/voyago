import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './auth'
import { CartProvider } from './cart'
import { IS_DEMO } from './api'
import './index.css'

// В демо-режиме (GitHub Pages) используем HashRouter — глубокие ссылки и обновление
// страницы работают без серверной настройки перезаписи путей.
const Router = IS_DEMO ? HashRouter : BrowserRouter

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
      <AuthProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </AuthProvider>
    </Router>
  </React.StrictMode>,
)
