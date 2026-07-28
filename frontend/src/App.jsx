import { Suspense, lazy, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'

/*
 * Même principe que dans main.jsx : la condition est statiquement fausse
 * en production, donc le bandeau et le module de bac à sable qu'il importe
 * disparaissent du bundle.
 */
const SandboxBanner =
  import.meta.env.DEV && import.meta.env.VITE_SANDBOX === '1'
    ? lazy(() => import('./components/SandboxBanner'))
    : null
import { useAuth } from './context/AuthContext'

import HomePage from './pages/HomePage'
import EventsPage from './pages/EventsPage'
import EventDetailPage from './pages/EventDetailPage'
import CategoriesPage from './pages/CategoriesPage'
import VenuesPage from './pages/VenuesPage'
import FavoritesPage from './pages/FavoritesPage'
import AboutPage from './pages/AboutPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import CheckoutInfoPage from './pages/checkout/CheckoutInfoPage'
import CheckoutPaymentPage from './pages/checkout/CheckoutPaymentPage'
import CheckoutConfirmationPage from './pages/checkout/CheckoutConfirmationPage'
import TicketPage from './pages/TicketPage'
import MyReservationsPage from './pages/MyReservationsPage'
import NotFoundPage from './pages/NotFoundPage'

/** Remet la page en haut à chaque navigation. */
function ScrollToTop() {
  const { pathname } = useLocation()

  // Corps en bloc obligatoire : une flèche à retour implicite renverrait la
  // valeur de scrollTo, que React prendrait pour une fonction de nettoyage.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

/** Renvoie vers la connexion en mémorisant la destination souhaitée. */
function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/connexion" state={{ from: location.pathname }} replace />
  }
  return children
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      {SandboxBanner && (
        <Suspense fallback={null}>
          <SandboxBanner />
        </Suspense>
      )}
      <Header />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/evenements" element={<EventsPage />} />
          <Route path="/evenements/:id" element={<EventDetailPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/lieux" element={<VenuesPage />} />
          <Route path="/favoris" element={<FavoritesPage />} />
          <Route path="/a-propos" element={<AboutPage />} />

          <Route path="/connexion" element={<LoginPage />} />
          <Route path="/inscription" element={<RegisterPage />} />

          {/* Tunnel de réservation : accessible à l'invité, qui crée son
              compte à l'étape 1 puisque la réservation exige un jeton. */}
          <Route path="/reservation/informations" element={<CheckoutInfoPage />} />
          <Route
            path="/reservation/paiement"
            element={
              <RequireAuth>
                <CheckoutPaymentPage />
              </RequireAuth>
            }
          />
          <Route
            path="/reservation/confirmation"
            element={
              <RequireAuth>
                <CheckoutConfirmationPage />
              </RequireAuth>
            }
          />

          <Route
            path="/mes-reservations"
            element={
              <RequireAuth>
                <MyReservationsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/mes-reservations/:id"
            element={
              <RequireAuth>
                <TicketPage />
              </RequireAuth>
            }
          />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <Footer />
    </div>
  )
}
