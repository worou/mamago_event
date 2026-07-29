import { useParams } from 'react-router-dom'
import { fetchEventById, fetchMyTickets } from '../api/services'
import { useAsync } from '../hooks/useAsync'
import { useAuth } from '../context/AuthContext'
import TicketView from '../components/ticket/TicketView'
import { Alert, Button, Spinner } from '../components/ui'
import { ArrowLeftIcon } from '../components/Icons'

/**
 * Consultation d'un billet depuis « Mes réservations ».
 *
 * Même écran que l'étape 4 du tunnel — la présentation est partagée via
 * `TicketView` — mais alimenté par l'API plutôt que par le brouillon de
 * commande.
 */
export default function TicketPage() {
  const { id } = useParams()
  const { user } = useAuth()

  const { data: ticket, error, isLoading } = useAsync(async (signal) => {
    const tickets = await fetchMyTickets(signal)
    return (
      tickets.find(
        (t) => String(t.id) === String(id) || String(t.reference) === String(id),
      ) ?? null
    )
  }, [id])

  // L'objet billet n'embarque pas toujours l'événement : on le complète.
  const { data: fallbackEvent } = useAsync(
    (signal) =>
      ticket && !ticket.event && ticket.eventId
        ? fetchEventById(ticket.eventId, signal)
        : Promise.resolve(null),
    [ticket?.eventId, Boolean(ticket?.event)],
  )

  const event = ticket?.event ?? fallbackEvent

  if (isLoading) {
    return (
      <div className="flex justify-center py-32">
        <Spinner className="h-8 w-8 text-brand-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <Alert>{error.message}</Alert>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Billet introuvable</h1>
        <p className="mt-2 text-slate-500">
          Ce billet n'existe pas ou n'est plus accessible depuis votre compte.
        </p>
        <Button as="link" to="/mes-reservations" className="mt-8">
          Retour à mes réservations
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Votre billet</h1>
          <p className="mt-2 text-slate-500">
            Voici votre billet pour l'événement. Présentez ce QR code à l'entrée
            pour accéder à l'événement.
          </p>
        </div>
        <Button variant="secondary" as="link" to="/mes-reservations">
          <ArrowLeftIcon className="h-4 w-4" /> Retour à mes réservations
        </Button>
      </div>

      <TicketView ticket={ticket} event={event} buyerName={user?.name} />
    </div>
  )
}
