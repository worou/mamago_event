import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { fetchEvents } from '../api/services'
import { useAsync } from '../hooks/useAsync'
import { Alert, EmptyState, SkeletonCard } from '../components/ui'
import { CalendarIcon, PinIcon, TicketIcon } from '../components/Icons'

/**
 * L'API n'expose pas de ressource « lieu ». Les événements portant chacun un
 * `location`, la page les regroupe côté client — ce qui suffit à alimenter
 * l'entrée « Lieux » présente dans toutes les maquettes.
 */
function groupByVenue(events) {
  const map = new Map()

  for (const event of events) {
    const name = event.location?.trim()
    if (!name) continue

    const key = name.toLowerCase()
    if (!map.has(key)) {
      map.set(key, {
        name,
        latitude: event.latitude,
        longitude: event.longitude,
        events: [],
      })
    }
    map.get(key).events.push(event)
  }

  return [...map.values()].sort((a, b) => b.events.length - a.events.length)
}

export default function VenuesPage() {
  const { data: events, error, isLoading } = useAsync((signal) => fetchEvents(signal))
  const venues = useMemo(() => groupByVenue(events ?? []), [events])

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Lieux</h1>
        <p className="mt-2 text-slate-500">
          Découvrez les salles et espaces qui accueillent nos événements.
        </p>
      </header>

      {error ? (
        <Alert>{error.message}</Alert>
      ) : isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : venues.length ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {venues.map((venue) => (
            <article key={venue.name} className="card flex flex-col p-6">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <PinIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="font-bold text-slate-900">{venue.name}</h2>
                  <p className="text-sm text-slate-500">
                    {venue.events.length} événement{venue.events.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <ul className="mt-5 flex-1 space-y-3 border-t border-slate-100 pt-4">
                {venue.events.map((event) => (
                  <li key={event.id}>
                    <Link
                      to={`/evenements/${event.id}`}
                      className="group flex items-start gap-2 text-sm"
                    >
                      <TicketIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                      <span className="min-w-0">
                        <span className="block font-medium text-slate-800 group-hover:text-brand-700">
                          {event.title}
                        </span>
                        {event.dateLabel && (
                          <span className="flex items-center gap-1.5 text-xs text-slate-500">
                            <CalendarIcon className="h-3.5 w-3.5" /> {event.dateLabel}
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>

              {venue.latitude != null && venue.longitude != null && (
                <a
                  href={`https://www.openstreetmap.org/?mlat=${venue.latitude}&mlon=${venue.longitude}#map=16/${venue.latitude}/${venue.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-2 border-t border-slate-100 pt-4 text-sm font-semibold text-brand-700 hover:underline"
                >
                  <PinIcon className="h-4 w-4" /> Voir sur la carte
                </a>
              )}
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="📍"
          title="Aucun lieu à afficher"
          description="Les lieux apparaîtront ici dès que des événements seront publiés."
        />
      )}
    </div>
  )
}
