import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useBooking } from '../../context/BookingContext'
import Stepper from '../../components/checkout/Stepper'
import TicketView from '../../components/ticket/TicketView'
import { Alert, Button } from '../../components/ui'
import { HomeIcon, TicketIcon } from '../../components/Icons'

/**
 * Étape 4 — le billet.
 *
 * Alimentée par le brouillon de commande plutôt que par l'API : la
 * réservation n'étant rattachée à aucun compte côté serveur, l'acheteur —
 * invité comme connecté — ne pourrait sinon jamais revoir son billet.
 */
export default function CheckoutTicketPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const booking = useBooking()

  /**
   * Commande figée au premier rendu : quitter l'écran vide le brouillon,
   * et cet instantané permet à la page de rester affichée pendant la purge.
   */
  const [snapshot] = useState(() => ({
    event: booking.event,
    guest: booking.guest,
    lines: booking.lines,
    subtotal: booking.subtotal,
    totalQuantity: booking.totalQuantity,
    order: booking.order,
  }))

  const { event, guest, lines, subtotal, totalQuantity, order } = snapshot

  if (!event || !order) {
    return <Navigate to="/evenements" replace />
  }

  const buyerName =
    user?.name || [guest?.firstName, guest?.lastName].filter(Boolean).join(' ')

  const [firstLine] = lines

  const ticket = {
    reference: order.id ?? '—',
    eventId: event.id,
    eventTitle: event.title,
    type: lines.map((l) => l.tier.type).join(', ') || 'Standard',
    quantity: totalQuantity,
    unitPrice: firstLine?.tier.price ?? 0,
    totalPrice: order.amount ?? subtotal,
    status: order.method === 'cash_on_delivery' ? 'pending' : 'paid',
    // Le backend ne renvoie ni charge utile de QR ni PDF : les deux sont
    // produits côté client à partir de la référence de commande.
    qrPayload: null,
    pdfUrl: null,
  }

  function leave(to) {
    booking.clearBooking()
    navigate(to)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Stepper current={4} />

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Votre billet</h1>
          <p className="mt-2 text-slate-500">
            Voici votre billet pour l'événement. Présentez ce QR code à
            l'entrée pour accéder à l'événement.
          </p>
        </div>
        <Button variant="secondary" onClick={() => leave('/')}>
          <HomeIcon className="h-4 w-4" /> Retour à l'accueil
        </Button>
      </div>

      <TicketView
        ticket={ticket}
        event={event}
        buyerName={buyerName}
        actions={
          <Alert tone="info">
            Conservez votre numéro de commande{' '}
            <strong className="whitespace-nowrap">{ticket.reference}</strong> :
            il identifie votre billet.
            {!user && ' Aucun compte n’a été créé pour cette réservation.'}
          </Alert>
        }
      />

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button variant="secondary" onClick={() => leave(`/evenements/${event.id}`)}>
          Revoir l'événement
        </Button>
        {user && (
          <Button onClick={() => leave('/mes-reservations')}>
            <TicketIcon className="h-5 w-5" /> Mes réservations
          </Button>
        )}
      </div>
    </div>
  )
}
