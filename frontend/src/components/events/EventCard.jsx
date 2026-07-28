import { Link } from 'react-router-dom'
import { useConfig } from '../../context/ConfigContext'
import { useFavorites } from '../../context/FavoritesContext'
import { formatPrice } from '../../lib/money'
import { Badge, EventImage, cx } from '../ui'
import { CalendarIcon, ClockIcon, HeartIcon, PinIcon } from '../Icons'

export default function EventCard({ event }) {
  const { config } = useConfig()
  const { isFavorite, toggle } = useFavorites()
  const active = isFavorite(event.id)

  return (
    <Link
      to={`/evenements/${event.id}`}
      className="card group flex flex-col overflow-hidden transition-shadow hover:shadow-lg"
    >
      <div className="relative h-44 overflow-hidden">
        <EventImage
          src={event.image}
          alt={event.title}
          className="h-full w-full transition-transform duration-300 group-hover:scale-105"
        />
        {event.category && (
          <span className="absolute top-3 left-3">
            <Badge>{event.category}</Badge>
          </span>
        )}
        <span className="absolute top-3 right-3 flex items-center gap-2">
          {event.isSoldOut && <Badge tone="warning">Complet</Badge>}
          <button
            type="button"
            onClick={(e) => {
              // La carte est un lien : on isole le clic sur le cœur.
              e.preventDefault()
              e.stopPropagation()
              toggle(event.id)
            }}
            aria-pressed={active}
            title={active ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            className={cx(
              'grid h-8 w-8 place-items-center rounded-full transition-colors',
              active
                ? 'bg-rose-500 text-white'
                : 'bg-black/35 text-white backdrop-blur hover:bg-black/55',
            )}
          >
            <HeartIcon filled={active} className="h-4 w-4" />
            <span className="sr-only">
              {active ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            </span>
          </button>
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 font-bold text-slate-900 group-hover:text-brand-700">
          {event.title}
        </h3>
        {event.subtitle && (
          <p className="mt-1 line-clamp-2 text-sm text-slate-500">{event.subtitle}</p>
        )}

        <dl className="mt-4 space-y-2 text-sm text-slate-600">
          {event.dateLabel && (
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 shrink-0 text-brand-600" />
              <dd>{event.dateLabel}</dd>
            </div>
          )}
          {event.timeLabel && (
            <div className="flex items-center gap-2">
              <ClockIcon className="h-4 w-4 shrink-0 text-brand-600" />
              <dd>{event.timeLabel}</dd>
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-2">
              <PinIcon className="h-4 w-4 shrink-0 text-brand-600" />
              <dd className="line-clamp-1">{event.location}</dd>
            </div>
          )}
        </dl>

        <div className="mt-5 flex items-end justify-between border-t border-slate-100 pt-4">
          <div>
            <p className="text-xs text-slate-500">À partir de</p>
            <p className="text-xl font-bold text-brand-700">
              {formatPrice(event.fromPrice, config)}
            </p>
          </div>
          <span className="text-sm font-semibold text-brand-700 group-hover:underline">
            Réserver
          </span>
        </div>
      </div>
    </Link>
  )
}
