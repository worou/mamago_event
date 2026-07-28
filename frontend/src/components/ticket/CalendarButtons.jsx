import { useState } from 'react'
import { buildCalendarLinks } from '../../lib/calendar'
import { cx } from '../ui'
import { CalendarIcon, ChevronDownIcon } from '../Icons'

/**
 * « Ajouter à mon calendrier ».
 *
 * `variant="grid"` reproduit les trois pastilles Google / Apple / Outlook de
 * la maquette du billet ; `variant="button"` le bouton unique de l'écran de
 * confirmation, qui déplie les mêmes destinations.
 */
export default function CalendarButtons({ event, variant = 'grid' }) {
  const [isOpen, setIsOpen] = useState(false)
  const links = buildCalendarLinks(event)

  // La date de l'API est une chaîne française ; si elle n'est pas
  // interprétable, mieux vaut ne rien proposer qu'un lien erroné.
  if (!links) return null

  const targets = [
    { key: 'google', label: 'Google', href: links.google, external: true },
    { key: 'apple', label: 'Apple', href: links.ics, download: `${event.title}.ics` },
    { key: 'outlook', label: 'Outlook', href: links.outlook, external: true },
  ]

  if (variant === 'grid') {
    return (
      <div className="grid grid-cols-3 gap-2">
        {targets.map((target) => (
          <a
            key={target.key}
            href={target.href}
            {...(target.external
              ? { target: '_blank', rel: 'noreferrer' }
              : { download: target.download })}
            className="rounded-xl border border-slate-300 px-2 py-2.5 text-center text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            {target.label}
          </a>
        ))}
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-base font-semibold text-slate-700 hover:bg-slate-50"
      >
        <CalendarIcon className="h-5 w-5" />
        Ajouter à mon calendrier
        <ChevronDownIcon className={cx('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute left-1/2 z-20 mt-2 w-48 -translate-x-1/2 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          {targets.map((target) => (
            <a
              key={target.key}
              href={target.href}
              {...(target.external
                ? { target: '_blank', rel: 'noreferrer' }
                : { download: target.download })}
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              {target.label}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
