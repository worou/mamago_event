import { Link } from 'react-router-dom'
import { useConfig } from '../../context/ConfigContext'
import { formatPrice } from '../../lib/money'
import { Badge, EventImage } from '../ui'
import { ArrowRightIcon, CalendarIcon, ClockIcon, HeadsetIcon, PinIcon, TicketIcon } from '../Icons'

/** Carte sombre affichée à gauche de chaque étape du tunnel. */
export default function EventSummaryCard({ event, showDetailLink = true }) {
  const { config } = useConfig()
  if (!event) return null

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl bg-ink-950 text-white shadow-sm">
        <div className="relative h-44">
          <EventImage src={event.image} alt={event.title} className="h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/40 to-transparent" />
          {event.category && (
            <span className="absolute top-3 left-3">
              <Badge>{event.category}</Badge>
            </span>
          )}
        </div>

        <div className="p-5">
          <h2 className="text-xl font-bold">{event.title}</h2>
          {event.subtitle && (
            <p className="mt-1 text-sm text-slate-300">{event.subtitle}</p>
          )}

          <dl className="mt-5 space-y-3 text-sm">
            {event.dateLabel && (
              <div className="flex items-center gap-3">
                <CalendarIcon className="h-4.5 w-4.5 shrink-0 text-slate-400" />
                <dd>{event.dateLabel}</dd>
              </div>
            )}
            {event.timeLabel && (
              <div className="flex items-center gap-3">
                <ClockIcon className="h-4.5 w-4.5 shrink-0 text-slate-400" />
                <dd>{event.timeLabel}</dd>
              </div>
            )}
            {event.location && (
              <div className="flex items-start gap-3">
                <PinIcon className="mt-0.5 h-4.5 w-4.5 shrink-0 text-slate-400" />
                <dd>{event.location}</dd>
              </div>
            )}
          </dl>

          {event.totalRemaining > 0 && (
            <div className="mt-5 flex items-center gap-3 rounded-xl bg-white/10 p-3">
              <TicketIcon className="h-5 w-5 shrink-0 text-brand-300" />
              <p className="text-sm">
                <span className="font-semibold">Places limitées !</span>
                <br />
                <span className="text-slate-300">
                  Plus que{' '}
                  <span className="font-semibold text-white">{event.totalRemaining}</span>{' '}
                  billets disponibles
                </span>
              </p>
            </div>
          )}

          {showDetailLink && (
            <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
              <div>
                <p className="text-xs text-slate-400">À partir de</p>
                <p className="text-2xl font-bold text-brand-300">
                  {formatPrice(event.fromPrice, config)}
                </p>
              </div>
              <Link
                to={`/evenements/${event.id}`}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-100"
              >
                Détails <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="card flex items-start gap-3 p-5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
          <HeadsetIcon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-900">Besoin d'aide ?</p>
          <p className="mt-1 text-xs text-slate-500">
            Notre service client est disponible 7j/7 pour vous accompagner.
          </p>
          {config.email && (
            <a
              href={`mailto:${config.email}`}
              className="mt-2 inline-block text-xs font-semibold text-brand-700 hover:underline"
            >
              Contactez-nous
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
