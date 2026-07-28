import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { BookingProvider } from './context/BookingContext'
import { ConfigProvider } from './context/ConfigContext'
import { FavoritesProvider } from './context/FavoritesContext'
import './index.css'

/*
 * Bac à sable : import dynamique sous une condition statiquement fausse en
 * production. Rollup élimine alors la branche entière, de sorte que le
 * simulateur n'est pas seulement inactif en ligne — il en est absent.
 *
 * L'installation précède le rendu : elle remplace window.fetch, et les
 * contextes déclenchent leurs appels dès le montage.
 */
if (import.meta.env.DEV && import.meta.env.VITE_SANDBOX === '1') {
  const { installSandbox } = await import('./api/sandbox')
  installSandbox()
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ConfigProvider>
        <AuthProvider>
          <FavoritesProvider>
            <BookingProvider>
              <App />
            </BookingProvider>
          </FavoritesProvider>
        </AuthProvider>
      </ConfigProvider>
    </BrowserRouter>
  </StrictMode>,
)
