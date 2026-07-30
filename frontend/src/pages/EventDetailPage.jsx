import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { fetchEventById } from '../api/services'
import { useAsync } from '../hooks/useAsync'
import { useBooking } from '../context/BookingContext'
import { useConfig } from '../context/ConfigContext'
import { useFavorites } from '../context/FavoritesContext'
import { formatMoney, formatPrice } from '../lib/money'
import { cleanDescription } from '../lib/text'
import TicketTierSelector from '../components/events/TicketTierSelector'
import EventStats from '../components/events/EventStats'
import PerformerList from '../components/events/PerformerList'
import VenueMap from '../components/events/VenueMap'
import PaymentBrands from '../components/PaymentBrands'
import { Alert, Avatar, Badge, Button, EventImage, Spinner, cx } from '../components/ui'
import {
  CalendarIcon,
  ClockIcon,
  HeadsetIcon,
  HeartIcon,
  PinIcon,
  ShieldIcon,
  TicketIcon,
  UserIcon,
} from '../components/Icons'

function FavoriteButton({ eventId, className }) {
  const { isFavorite, toggle } = useFavorites()
  const active = isFavorite(eventId)

  return (
    <button
      type="button"
      onClick={() => toggle(eventId)}
      aria-pressed={active}
      title={active ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      className={cx(
        'grid place-items-center rounded-full transition-colors',
        active
          ? 'bg-rose-500 text-white hover:bg-rose-600'
          : 'bg-white/15 text-white ring-1 ring-white/30 backdrop-blur hover:bg-white/25',
        className,
      )}
    >
      <HeartIcon filled={active} className="h-5 w-5" />
      <span className="sr-only">
        {active ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      </span>
    </button>
  )
}

function BookingPanel({ event, quantities, setQuantity, onSubmit, panelRef }) {
  const { config } = useConfig()

  const total = useMemo(
    () =>
      event.tiers.reduce(
        (sum, tier) => sum + tier.price * (quantities[tier.id] ?? 0),
        0,
      ),
    [event.tiers, quantities],
  )

  const count = Object.values(quantities).reduce((a, b) => a + b, 0)

  return (
    <div ref={panelRef} className="card sticky top-20 p-6">
      <h2 className="text-lg font-bold text-slate-900">Réservez vos billets</h2>

      <p className="mt-3 text-sm text-slate-500">À partir de</p>
      <p className="text-3xl font-bold text-brand-700">
        {formatPrice(event.fromPrice, config)}
      </p>

      {event.totalRemaining > 0 && (
        <div className="mt-4 flex items-start gap-3 rounded-xl bg-brand-50 p-4">
          <TicketIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
          <p className="text-sm text-slate-700">
            <span className="font-semibold">Places limitées !</span>
            <br />
            Plus que{' '}
            <span className="font-semibold text-brand-700">{event.totalRemaining}</span>{' '}
            billets disponibles
          </p>
        </div>
      )}

      <h3 className="mt-6 mb-3 text-sm font-semibold text-slate-900">
        Sélectionnez vos billets
      </h3>
      <TicketTierSelector
        tiers={event.tiers}
        quantities={quantities}
        onChange={setQuantity}
      />

      <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
        <span className="font-semibold text-slate-900">Total</span>
        <span className="text-2xl font-bold text-brand-700">
          {formatMoney(total, config)}
        </span>
      </div>

      <Button
        size="lg"
        className="mt-4 w-full"
        onClick={onSubmit}
        disabled={count === 0 || event.isSoldOut}
      >
        <TicketIcon className="h-5 w-5" />
        {event.isSoldOut ? 'Complet' : 'Réserver maintenant'}
      </Button>

      {count === 0 && !event.isSoldOut && (
        <p className="mt-2 text-center text-xs text-slate-500">
          Choisissez au moins un billet pour continuer.
        </p>
      )}

      <p className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
        <ShieldIcon className="h-4 w-4 text-success-600" />
        Paiement sécurisé
      </p>

      <PaymentBrands className="mt-4" />

      <div className="mt-6 flex items-start gap-3 rounded-xl bg-brand-50 p-4">
        <HeadsetIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
        <p className="text-sm text-slate-700">
          <span className="font-semibold">Besoin d'aide ?</span>
          <br />
          <span className="text-slate-600">Contactez notre service client</span>
        </p>
      </div>
    </div>
  )
}

export default function EventDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { startBooking } = useBooking()
  const [quantities, setQuantities] = useState({})
  const panelRef = useRef(null)

  const { data: event, error, isLoading } = useAsync(
    (signal) => fetchEventById(id, signal),
    [id],
  )

  /**
   * Une seule catégorie par commande : `ticket/web/book` n'accepte qu'un
   * `ticket_type`. Sélectionner une autre catégorie remplace la précédente.
   */
  function setQuantity(tierId, quantity) {
    setQuantities(quantity > 0 ? { [tierId]: quantity } : {})
  }

  function handleBooking() {
    startBooking(event, quantities)
    navigate('/reservation/informations')
  }

  /** Le CTA du visuel amène au panneau plutôt que de sauter une étape. */
  function scrollToPanel() {
    panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

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

  if (!event) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Événement introuvable</h1>
        <p className="mt-2 text-slate-500">
          Cet événement n'existe pas ou n'est plus disponible.
        </p>
        <Button as="link" to="/evenements" className="mt-8">
          Voir tous les événements
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="Fil d'Ariane" className="mb-6 text-sm text-slate-500">
        <Link to="/" className="hover:text-brand-700">Accueil</Link>
        <span className="mx-2">›</span>
        <Link to="/evenements" className="hover:text-brand-700">Événements</Link>
        <span className="mx-2">›</span>
        <span className="text-slate-900">{event.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0">
          {/* Visuel principal, avec CTA et favori posés dessus. */}
          <div className="relative overflow-hidden rounded-2xl">
            <EventImage src={event.image} alt={event.title} className="h-72 w-full sm:h-96" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/55 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
              {event.category && <Badge>{event.category}</Badge>}
              <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{event.title}</h1>

              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-200">
                {event.dateLabel && (
                  <span className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" /> {event.dateLabel}
                  </span>
                )}
                {event.timeLabel && (
                  <span className="flex items-center gap-2">
                    <ClockIcon className="h-4 w-4" /> {event.timeLabel}
                  </span>
                )}
                {event.location && (
                  <span className="flex items-center gap-2">
                    <PinIcon className="h-4 w-4" /> {event.location}
                  </span>
                )}
              </div>

              <div className="mt-6 flex items-center gap-3">
                <Button size="lg" onClick={scrollToPanel} disabled={event.isSoldOut}>
                  <TicketIcon className="h-5 w-5" />
                  {event.isSoldOut ? 'Complet' : 'Réserver maintenant'}
                </Button>
                <FavoriteButton eventId={event.id} className="h-12 w-12" />
              </div>
            </div>
          </div>

          {/* Deux colonnes : présentation à gauche, informations à droite. */}
          <div className="mt-10 grid gap-10 md:grid-cols-2">
            <section>
              <h2 className="text-xl font-bold text-slate-900">À propos de l'événement</h2>
              <p className="mt-4 leading-relaxed whitespace-pre-line text-slate-600">
                {cleanDescription(event.description) ||
                cleanDescription(event.subtitle) ||
                'Description à venir.'}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900">Informations pratiques</h2>
              <dl className="mt-4 space-y-5">
                {event.dateLabel && (
                  <div className="flex gap-3">
                    <CalendarIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                    <div>
                      <dt className="text-sm font-semibold text-slate-900">Date</dt>
                      <dd className="text-sm text-slate-600">{event.dateLabel}</dd>
                    </div>
                  </div>
                )}
                {event.timeLabel && (
                  <div className="flex gap-3">
                    <ClockIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                    <div>
                      <dt className="text-sm font-semibold text-slate-900">Heure</dt>
                      <dd className="text-sm text-slate-600">{event.timeLabel}</dd>
                    </div>
                  </div>
                )}
                {(event.location || event.venue?.title) && (
                  <div className="flex gap-3">
                    <PinIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                    <div>
                      <dt className="text-sm font-semibold text-slate-900">Lieu</dt>
                      {event.venue?.title && (
                        <dd className="text-sm font-medium text-slate-800">
                          {event.venue.title}
                        </dd>
                      )}
                      {event.location && (
                        <dd className="text-sm text-slate-600">{event.location}</dd>
                      )}
                    </div>
                  </div>
                )}
                {event.category && (
                  <div className="flex gap-3">
                    <TicketIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                    <div>
                      <dt className="text-sm font-semibold text-slate-900">Catégorie</dt>
                      <dd className="text-sm text-slate-600">
                        {[event.category, event.style].filter(Boolean).join(' • ')}
                      </dd>
                    </div>
                  </div>
                )}
                {event.mainOrganizer && (
                  <div className="flex gap-3">
                    <UserIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                    <div>
                      <dt className="text-sm font-semibold text-slate-900">Organisateur</dt>
                      <dd className="text-sm text-slate-600">
                        {event.mainOrganizer.name}
                      </dd>
                    </div>
                  </div>
                )}
              </dl>
            </section>
          </div>

          <EventStats event={event} />

          <PerformerList performers={event.performers} />

          {event.gallery.length > 0 && (
            <section className="mt-10">
              <h2 className="text-xl font-bold text-slate-900">Galerie</h2>
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {event.gallery.map((src, i) => (
                  <EventImage
                    key={i}
                    src={src}
                    alt={`${event.title} — photo ${i + 1}`}
                    className="h-28 w-full rounded-xl"
                  />
                ))}
              </div>
            </section>
          )}

          {event.latitude != null && event.longitude != null && (
            <section className="mt-10">
              <h2 className="mb-4 text-xl font-bold text-slate-900">Lieu sur la carte</h2>
              <VenueMap
                latitude={event.latitude}
                longitude={event.longitude}
                location={event.venue?.title || event.location}
              />
            </section>
          )}

          {event.organizers.length > 0 && (
            <section className="mt-10">
              <h2 className="text-xl font-bold text-slate-900">
                Organisateurs & partenaires
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {event.organizers.map((org) => (
                  <div key={org.id} className="card flex items-start gap-4 p-5">
                    <Avatar src={org.image} name={org.name} className="h-12 w-12 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{org.name}</p>
                      <p className="text-xs font-medium text-brand-700">{org.role}</p>
                      {org.bio && (
                        <p className="mt-1 line-clamp-2 text-sm text-slate-500">{org.bio}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside>
          <BookingPanel
            event={event}
            quantities={quantities}
            setQuantity={setQuantity}
            onSubmit={handleBooking}
            panelRef={panelRef}
          />
        </aside>
      </div>
    </div>
  )
}
