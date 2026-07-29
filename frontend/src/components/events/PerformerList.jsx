import { useState } from 'react'
import { Avatar, cx } from '../ui'
import { MicIcon } from '../Icons'

/**
 * Programmation de l'événement.
 *
 * Le champ `participants` de l'API désigne les artistes, non le public.
 * Les biographies pouvant être longues, elles sont tronquées puis
 * dépliables.
 */
function Performer({ performer }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const isLong = performer.bio.length > 220

  return (
    <article className="card flex flex-col gap-4 p-5 sm:flex-row">
      <Avatar
        src={performer.image}
        name={performer.name}
        className="h-20 w-20 shrink-0 sm:h-24 sm:w-24"
      />

      <div className="min-w-0 flex-1">
        <h3 className="font-bold text-slate-900">{performer.name}</h3>
        {performer.role && (
          <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700">
            <MicIcon className="h-3.5 w-3.5" />
            {performer.role}
          </p>
        )}

        {performer.bio && (
          <>
            <p
              className={cx(
                'mt-2 text-sm leading-relaxed text-slate-600',
                !isExpanded && isLong && 'line-clamp-3',
              )}
            >
              {performer.bio}
            </p>
            {isLong && (
              <button
                type="button"
                onClick={() => setIsExpanded((open) => !open)}
                aria-expanded={isExpanded}
                className="mt-1.5 text-xs font-semibold text-brand-700 hover:underline"
              >
                {isExpanded ? 'Réduire' : 'Lire la suite'}
              </button>
            )}
          </>
        )}
      </div>
    </article>
  )
}

export default function PerformerList({ performers }) {
  if (!performers?.length) return null

  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold text-slate-900">
        {performers.length > 1 ? 'À l’affiche' : 'Artiste à l’affiche'}
      </h2>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {performers.map((performer) => (
          <Performer key={performer.name} performer={performer} />
        ))}
      </div>
    </section>
  )
}
