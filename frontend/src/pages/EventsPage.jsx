import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fetchCategories, fetchEvents } from '../api/services'
import { useAsync } from '../hooks/useAsync'
import EventCard from '../components/events/EventCard'
import { Alert, Button, EmptyState, SkeletonCard, cx } from '../components/ui'
import { SearchIcon } from '../components/Icons'

export default function EventsPage() {
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const category = params.get('categorie') ?? ''

  const { data: events, error, isLoading, reload } = useAsync((signal) => fetchEvents(signal))
  const { data: categories } = useAsync((signal) => fetchCategories(signal))

  /**
   * `events/list` ignore les paramètres de requête côté serveur
   * (limit, offset et category_id sont sans effet) : recherche et filtrage
   * sont donc appliqués côté client sur la liste complète.
   */
  const filtered = useMemo(() => {
    if (!events) return []
    const needle = query.trim().toLowerCase()

    return events.filter((event) => {
      const matchesCategory = !category || event.category === category
      if (!matchesCategory) return false
      if (!needle) return true

      return [event.title, event.subtitle, event.location, event.description]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(needle))
    })
  }, [events, query, category])

  function updateParam(key, value) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Tous les événements</h1>
        <p className="mt-2 text-slate-500">
          Trouvez l'événement qui vous correspond et réservez votre billet.
        </p>
      </header>

      <div className="mb-8 space-y-4">
        <div className="relative max-w-md">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => updateParam('q', e.target.value)}
            placeholder="Rechercher un événement, un lieu..."
            aria-label="Rechercher un événement"
            className="field pl-10"
          />
        </div>

        {categories?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => updateParam('categorie', '')}
              className={cx(
                'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                !category
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
              )}
            >
              Toutes
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => updateParam('categorie', cat.title)}
                className={cx(
                  'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                  category === cat.title
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
                )}
              >
                {cat.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {error ? (
        <Alert>
          {error.message}
          <button onClick={reload} className="ml-2 font-semibold underline">
            Réessayer
          </button>
        </Alert>
      ) : isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length ? (
        <>
          <p className="mb-4 text-sm text-slate-500">
            {filtered.length} événement{filtered.length > 1 ? 's' : ''} trouvé
            {filtered.length > 1 ? 's' : ''}
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          icon="🔍"
          title="Aucun événement ne correspond"
          description="Essayez avec d'autres mots-clés ou retirez les filtres."
          action={
            <Button
              variant="secondary"
              onClick={() => setParams(new URLSearchParams(), { replace: true })}
            >
              Réinitialiser les filtres
            </Button>
          }
        />
      )}
    </div>
  )
}
