import { useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchBanners, fetchCategories, fetchEvents, fetchTodayEvents, fetchTopEvents } from '../api/services'
import { useAsync } from '../hooks/useAsync'
import { useConfig } from '../context/ConfigContext'
import { formatPrice } from '../lib/money'
import EventCard from '../components/events/EventCard'
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  EventImage,
  RemoteIcon,
  SkeletonCard,
} from '../components/ui'
import { ArrowRightIcon, CalendarIcon, PinIcon } from '../components/Icons'

function Hero({ banners }) {
  const { config } = useConfig()
  const [index, setIndex] = useState(0)

  // Aucune bannière côté serveur : on garde le même traitement visuel.
  if (!banners?.length) {
    return (
      <section className="relative bg-ink-950 text-white">
        <div className="absolute inset-0">
          <EventImage src={null} alt="" className="h-full w-full" />
          <div className="absolute inset-0 bg-ink-950/70" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold sm:text-5xl">
            Vivez les événements qui comptent
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-slate-300">
            Concerts, culture, sport et conférences. Réservez votre billet en
            quelques clics et recevez-le immédiatement.
          </p>
          <Button as="link" to="/evenements" size="lg" className="mt-8">
            Découvrir les événements <ArrowRightIcon className="h-5 w-5" />
          </Button>
        </div>
      </section>
    )
  }

  const banner = banners[index]
  const event = banner.event

  return (
    <section className="relative bg-ink-950 text-white">
      <div className="absolute inset-0">
        <EventImage src={banner.image ?? event?.image} alt="" className="h-full w-full" />
        {/* Voile latéral : assombri à gauche pour le texte, dégagé à droite
            pour laisser voir le visuel. */}
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/70 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="max-w-2xl">
          {event?.category && <Badge>{event.category}</Badge>}
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            {banner.title || event?.title}
          </h1>
          {(banner.subtitle || event?.subtitle) && (
            <p className="mt-4 text-lg text-slate-300">
              {banner.subtitle || event.subtitle}
            </p>
          )}

          {event && (
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-300">
              {event.dateLabel && (
                <span className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" /> {event.dateLabel}
                </span>
              )}
              {event.location && (
                <span className="flex items-center gap-2">
                  <PinIcon className="h-4 w-4" /> {event.location}
                </span>
              )}
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-4">
            {event && (
              <Button as="link" to={`/evenements/${event.id}`} size="lg">
                Réserver maintenant
              </Button>
            )}
            {event?.fromPrice > 0 && (
              <p className="text-sm text-slate-300">
                À partir de{' '}
                <span className="text-lg font-bold text-white">
                  {formatPrice(event.fromPrice, config)}
                </span>
              </p>
            )}
          </div>

          {banners.length > 1 && (
            <div className="mt-10 flex gap-2">
              {banners.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Bannière ${i + 1}`}
                  aria-current={i === index}
                  className={
                    i === index
                      ? 'h-2 w-8 rounded-full bg-brand-500'
                      : 'h-2 w-2 rounded-full bg-white/40 hover:bg-white/70'
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function CategoryStrip({ categories }) {
  if (!categories?.length) return null

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h2 className="mb-6 text-2xl font-bold text-slate-900">Explorer par catégorie</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {categories.map((category) => (
          <Link
            key={category.id}
            to={`/evenements?categorie=${encodeURIComponent(category.title)}`}
            className="card flex flex-col items-center gap-3 p-6 transition-shadow hover:shadow-md"
          >
            <RemoteIcon src={category.image} className="h-12 w-12" />
            <span className="text-sm font-semibold text-slate-800">{category.title}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}

function EventSection({ title, subtitle, events, isLoading, cta }) {
  // Les sections « aujourd'hui » et « tendances » sont vides côté API :
  // on les masque plutôt que d'afficher un bloc creux.
  if (!isLoading && !events?.length) return null

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
        {cta && (
          <Link
            to={cta.to}
            className="shrink-0 text-sm font-semibold text-brand-700 hover:underline"
          >
            {cta.label}
          </Link>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 3 }, (_, i) => <SkeletonCard key={i} />)
          : events.map((event) => <EventCard key={event.id} event={event} />)}
      </div>
    </section>
  )
}

export default function HomePage() {
  const banners = useAsync((signal) => fetchBanners(signal))
  const categories = useAsync((signal) => fetchCategories(signal))
  const events = useAsync((signal) => fetchEvents(signal))
  const today = useAsync((signal) => fetchTodayEvents(signal))
  const top = useAsync((signal) => fetchTopEvents(signal))

  return (
    <>
      {banners.isLoading ? (
        <div className="h-80 animate-pulse bg-ink-950" />
      ) : (
        <Hero banners={banners.data} />
      )}

      <CategoryStrip categories={categories.data} />

      <EventSection
        title="Aujourd'hui"
        subtitle="Les événements du jour"
        events={today.data}
        isLoading={today.isLoading}
      />

      <EventSection
        title="Tendances"
        subtitle="Les événements les plus demandés"
        events={top.data}
        isLoading={top.isLoading}
      />

      <section className="mx-auto max-w-7xl px-4 py-8 pb-16 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Tous les événements</h2>
            <p className="mt-1 text-sm text-slate-500">
              Réservez votre place pour les prochains rendez-vous
            </p>
          </div>
          <Link to="/evenements" className="shrink-0 text-sm font-semibold text-brand-700 hover:underline">
            Voir tout
          </Link>
        </div>

        {events.error ? (
          <Alert>
            Les événements n'ont pas pu être chargés. {events.error.message}
            <button onClick={events.reload} className="ml-2 font-semibold underline">
              Réessayer
            </button>
          </Alert>
        ) : events.isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : events.data.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.data.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Aucun événement pour le moment"
            description="De nouveaux événements seront publiés prochainement. Revenez bientôt !"
          />
        )}
      </section>
    </>
  )
}
