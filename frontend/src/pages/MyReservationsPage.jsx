import { Link } from 'react-router-dom'
import { fetchMyTickets } from '../api/services'
import { useAsync } from '../hooks/useAsync'
import { useAuth } from '../context/AuthContext'
import { useConfig } from '../context/ConfigContext'
import { formatMoney } from '../lib/money'
import { Alert, Badge, Button, EmptyState, EventImage, SkeletonCard } from '../components/ui'
import { ArrowRightIcon, CalendarIcon, PinIcon, TicketIcon } from '../components/Icons'

function statusTone(status) {
  const value = String(status).toLowerCase()
  if (['paid', 'confirmed', 'success', 'completed', 'confirmé'].includes(value))
    return { tone: 'success', label: 'Confirmé' }
  if (['pending', 'unpaid', 'en attente'].includes(value))
    return { tone: 'warning', label: 'En attente' }
  if (['canceled', 'cancelled', 'failed'].includes(value))
    return { tone: 'neutral', label: 'Annulé' }
  return { tone: 'neutral', label: status || 'Inconnu' }
}

function ReservationCard({ ticket }) {
  const { config } = useConfig()
  const badge = statusTone(ticket.status)
  const event = ticket.event

  return (
    <article className="card flex flex-col gap-4 overflow-hidden p-5 sm:flex-row">
      <div className="h-32 w-full shrink-0 overflow-hidden rounded-xl sm:h-24 sm:w-32">
        <EventImage
          src={event?.image}
          alt={ticket.eventTitle}
          className="h-full w-full"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2 className="font-bold text-slate-900">{ticket.eventTitle}</h2>
          <Badge tone={badge.tone}>{badge.label}</Badge>
        </div>

        <dl className="mt-2 space-y-1 text-sm text-slate-600">
          {event?.dateLabel && (
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 shrink-0 text-brand-600" />
              <dd>{event.dateLabel}</dd>
            </div>
          )}
          {event?.location && (
            <div className="flex items-center gap-2">
              <PinIcon className="h-4 w-4 shrink-0 text-brand-600" />
              <dd className="line-clamp-1">{event.location}</dd>
            </div>
          )}
          <div className="flex items-center gap-2">
            <TicketIcon className="h-4 w-4 shrink-0 text-brand-600" />
            <dd>
              {ticket.quantity} × {ticket.type}
              {ticket.totalPrice > 0 && ` — ${formatMoney(ticket.totalPrice, config)}`}
            </dd>
          </div>
        </dl>

        {ticket.reference && (
          <p className="mt-2 text-xs text-slate-500">
            N° de commande{' '}
            <span className="font-semibold text-brand-700">{ticket.reference}</span>
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-end">
        <Button as="link" to={`/mes-reservations/${ticket.id ?? ticket.reference}`} size="sm">
          Voir le billet <ArrowRightIcon className="h-4 w-4" />
        </Button>
      </div>
    </article>
  )
}

export default function MyReservationsPage() {
  const { user } = useAuth()
  const { data: tickets, error, isLoading, reload } = useAsync((signal) =>
    fetchMyTickets(signal),
  )

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Mes réservations</h1>
        <p className="mt-2 text-slate-500">
          {user?.name ? `Bonjour ${user.name}, ` : ''}
          retrouvez ici tous vos billets et téléchargez-les à tout moment.
        </p>
      </header>

      {error ? (
        <Alert>
          {error.message}
          <button onClick={reload} className="ml-2 font-semibold underline">
            Réessayer
          </button>
        </Alert>
      ) : isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : tickets?.length ? (
        <div className="space-y-4">
          {tickets.map((ticket, index) => (
            <ReservationCard key={ticket.id ?? ticket.reference ?? index} ticket={ticket} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Aucune réservation pour le moment"
          description="Vous n'avez pas encore réservé de billet. Découvrez les événements à venir et réservez votre place."
          action={
            <Button as="link" to="/evenements" size="lg">
              Découvrir les événements
            </Button>
          }
        />
      )}

      <p className="mt-8 text-center text-sm text-slate-500">
        Une question sur une commande ?{' '}
        <Link to="/a-propos" className="font-medium text-brand-700 hover:underline">
          Contactez notre service client
        </Link>
      </p>
    </div>
  )
}
