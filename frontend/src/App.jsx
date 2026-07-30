import { Suspense, lazy, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import { Spinner } from './components/ui'
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
import NotFoundPage from './pages/NotFoundPage'

/*
 * Tunnel de réservation et espace client, chargés à la demande.
 *
 * Ils entraînent Stripe et jsPDF, inutiles à qui parcourt simplement le
 * catalogue. Les séparer allège d'autant la première visite.
 */
const CheckoutInfoPage = lazy(() => import('./pages/checkout/CheckoutInfoPage'))
const CheckoutPaymentPage = lazy(() => import('./pages/checkout/CheckoutPaymentPage'))
const CheckoutConfirmationPage = lazy(
  () => import('./pages/checkout/CheckoutConfirmationPage'),
)
const CheckoutTicketPage = lazy(() => import('./pages/checkout/CheckoutTicketPage'))
const TicketPage = lazy(() => import('./pages/TicketPage'))
const MyReservationsPage = lazy(() => import('./pages/MyReservationsPage'))

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
      <Header />

      <main className="flex-1">
        <Suspense
          fallback={
            <div className="flex justify-center py-32">
              <Spinner className="h-8 w-8 text-brand-600" />
            </div>
          }
        >
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

          {/* Tunnel de réservation, accessible sans compte : la route
              d'enregistrement n'exige pas de jeton. « Mes réservations »
              reste réservé aux comptes, faute de quoi il n'y aurait rien
              à y rattacher. */}
          <Route path="/reservation/informations" element={<CheckoutInfoPage />} />
          <Route path="/reservation/paiement" element={<CheckoutPaymentPage />} />
          <Route
            path="/reservation/confirmation"
            element={<CheckoutConfirmationPage />}
          />
          <Route path="/reservation/billet" element={<CheckoutTicketPage />} />

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
        </Suspense>
      </main>

      <Footer />
    </div>
  )
}
