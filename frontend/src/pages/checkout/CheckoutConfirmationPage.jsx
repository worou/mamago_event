import { useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useBooking } from '../../context/BookingContext'
import { useConfig } from '../../context/ConfigContext'
import { formatMoney } from '../../lib/money'
import { downloadTicketPdf } from '../../lib/ticket'
import { isTicketEmailEnabled } from '../../lib/payment'
import Stepper from '../../components/checkout/Stepper'
import EventSummaryCard from '../../components/checkout/EventSummaryCard'
import TicketStub from '../../components/ticket/TicketStub'
import Confetti from '../../components/ticket/Confetti'
import CalendarButtons from '../../components/ticket/CalendarButtons'
import ShareButton from '../../components/ticket/ShareButton'
import ResendMailButton from '../../components/ticket/ResendMailButton'
import { Alert, Button } from '../../components/ui'
import { CheckIcon, DownloadIcon, MailIcon, TicketIcon } from '../../components/Icons'

export default function CheckoutConfirmationPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { config } = useConfig()
  const { user } = useAuth()
  const booking = useBooking()
  const [isDownloading, setIsDownloading] = useState(false)

  /**
   * La commande est figée au premier rendu.
   *
   * Le brouillon est vidé lorsque l'utilisateur quitte l'écran, mais cet
   * instantané garantit que la page continue de s'afficher pendant et après
   * cette purge — y compris sous StrictMode, qui monte puis démonte les
   * composants une première fois en développement.
   */
  const [snapshot] = useState(() => ({
    event: booking.event,
    guest: booking.guest,
    lines: booking.lines,
    subtotal: booking.subtotal,
    totalQuantity: booking.totalQuantity,
    order: booking.order,
  }))

  const { event, lines, subtotal, totalQuantity, order, guest } = snapshot

  // L'acheteur peut être connecté ou avoir commandé en invité.
  const buyerName = user?.name ?? [guest?.firstName, guest?.lastName].filter(Boolean).join(' ')
  const buyerEmail = user?.email ?? guest?.email ?? ''

  /**
   * Au retour de la page de paiement hébergée, le statut est transmis en
   * paramètre d'URL. Les libellés varient selon la passerelle : tout ce qui
   * n'est pas explicitement un échec est considéré comme réussi.
   */
  const status = (params.get('status') ?? params.get('flag') ?? '').toLowerCase()
  const hasFailed = ['fail', 'failed', 'cancel', 'canceled', 'cancelled', 'error'].includes(
    status,
  )

  if (!event || !order) {
    return <Navigate to="/mes-reservations" replace />
  }

  /** La réservation est aboutie : le brouillon est libéré à la sortie. */
  function leave(to) {
    booking.clearBooking()
    navigate(to)
  }

  const seats = order.seats ?? []

  const ticket = {
    reference: order.id ?? '—',
    eventId: event.id,
    eventTitle: event.title,
    seats,
    type: order.ticketType || lines.map((l) => l.tier.type).join(', ') || 'Standard',
    quantity: totalQuantity,
    totalPrice: order.amount ?? subtotal,
    /*
     * Charge utile émise par le serveur pour la première place.
     * `buildQrPayload` la retrouverait via `seats`, mais la nommer ici rend
     * explicite que le QR affiché n'est pas reconstitué localement : c'est
     * celui que le contrôle à l'entrée attend.
     */
    qrPayload: seats[0]?.qrPayload ?? null,
  }

  async function handleDownload() {
    setIsDownloading(true)
    try {
      await downloadTicketPdf({ ticket, event, config })
    } finally {
      setIsDownloading(false)
    }
  }

  if (hasFailed) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Stepper current={3} />
        <div className="card p-8 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-rose-50 text-3xl">
            ✕
          </span>
          <h1 className="mt-5 text-2xl font-bold text-slate-900">
            Le paiement n'a pas abouti
          </h1>
          <p className="mt-2 text-slate-500">
            Votre réservation n'a pas été confirmée. Aucun montant n'a été débité.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button variant="secondary" onClick={() => leave(`/evenements/${event.id}`)}>
              Retour à l'événement
            </Button>
            {/* La sélection est conservée pour permettre un nouvel essai. */}
            <Button onClick={() => navigate('/reservation/paiement')}>Réessayer</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Stepper current={3} />

      {/* Comme sur la maquette : événement et récapitulatif à gauche,
          confirmation et billet à droite. */}
      <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
        <div className="space-y-4">
          <EventSummaryCard event={event} showDetailLink={false} />

          <section className="card p-5">
            <h2 className="mb-4 font-bold text-slate-900">
              Récapitulatif de votre commande
            </h2>
            <dl className="space-y-3 text-sm">
              {lines.map(({ tier, quantity, total }) => (
                <div key={tier.id}>
                  <div className="flex justify-between">
                    <dt className="text-slate-600">Type de billet</dt>
                    <dd className="font-medium text-slate-900">{tier.type}</dd>
                  </div>
                  <div className="mt-2 flex justify-between">
                    <dt className="text-slate-600">Quantité</dt>
                    <dd className="font-medium text-slate-900">{quantity}</dd>
                  </div>
                  <div className="mt-2 flex justify-between">
                    <dt className="text-slate-600">Prix unitaire</dt>
                    <dd className="font-medium text-slate-900">
                      {formatMoney(tier.price, config)}
                    </dd>
                  </div>
                </div>
              ))}

              {order.serviceFee > 0 && (
                <div className="flex justify-between">
                  <dt className="text-slate-600">{config.serviceFee.label}</dt>
                  <dd className="font-medium text-slate-900">
                    {formatMoney(order.serviceFee, config)}
                  </dd>
                </div>
              )}

              <div className="flex items-baseline justify-between border-t border-slate-200 pt-3">
                <dt className="font-semibold text-slate-900">Total payé</dt>
                <dd className="text-xl font-bold text-brand-700">
                  {formatMoney(order.amount ?? subtotal, config)}
                </dd>
              </div>
            </dl>

            {buyerEmail && isTicketEmailEnabled() && (
              <>
                <div className="mt-5 flex items-start gap-3 rounded-xl bg-brand-50 p-4">
                  <MailIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                  <p className="text-xs text-slate-700">
                    Votre billet vous est envoyé à{' '}
                    <span className="font-semibold text-brand-700">{buyerEmail}</span>.
                    Pensez à vérifier vos courriers indésirables.
                  </p>
                </div>

                <ResendMailButton
                  className="mt-3"
                  transactionId={order.transactionId ?? order.id}
                  email={buyerEmail}
                  name={buyerName}
                />
              </>
            )}
          </section>
        </div>

        <div className="card p-6 sm:p-10">
        <div className="text-center">
          <Confetti>
            <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-success-50">
              <CheckIcon className="h-10 w-10 text-success-600" />
            </span>
          </Confetti>
          <h1 className="mt-5 text-3xl font-bold text-success-700">
            Réservation confirmée !
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-slate-500">
            Merci pour votre confiance. Votre réservation a été effectuée avec
            succès. Voici votre billet, présentez-le à l'entrée de l'événement.
          </p>
        </div>

        <div className="mt-8">
          <TicketStub
            ticket={ticket}
            event={event}
            rows={[
              seats[0]?.number
                ? ['N° de billet', seats[0].number]
                : ['N° de commande', String(ticket.reference)],
              ['Nom', seats[0]?.holderName || buyerName || '—'],
              ['Date', event.dateLabel || '—'],
              ['Lieu', event.venue?.title || event.location || '—'],
            ]}
          />
        </div>

        {seats.length > 1 && (
          <p className="mt-4 text-center text-sm text-slate-500">
            Cette réservation comporte{' '}
            <strong className="text-slate-900">{seats.length} billets</strong>,
            chacun avec son propre QR code. Ouvrez « Voir mon billet » pour
            les retrouver tous.
          </p>
        )}

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {/* L'étape 4 lit le brouillon : y aller sans le purger. */}
          <Button size="lg" onClick={() => navigate('/reservation/billet')}>
            <TicketIcon className="h-5 w-5" />
            Voir mon billet
          </Button>
          <CalendarButtons event={event} variant="button" />
          <ShareButton event={event} />
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Button variant="ghost" onClick={handleDownload} isLoading={isDownloading}>
            <DownloadIcon className="h-5 w-5" />
            Télécharger le billet (PDF)
          </Button>
        </div>

        <Alert tone="info" className="mt-8">
          Conservez votre numéro de commande : il vous permet de retrouver votre
          billet à tout moment depuis <strong>Mes réservations</strong>.
        </Alert>
        </div>
      </div>
    </div>
  )
}
