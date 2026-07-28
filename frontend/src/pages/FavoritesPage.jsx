import { useMemo } from 'react'
import { fetchEvents } from '../api/services'
import { useAsync } from '../hooks/useAsync'
import { useFavorites } from '../context/FavoritesContext'
import EventCard from '../components/events/EventCard'
import { Alert, Button, EmptyState, SkeletonCard } from '../components/ui'

export default function FavoritesPage() {
  const { isFavorite, count } = useFavorites()
  const { data: events, error, isLoading } = useAsync((signal) => fetchEvents(signal))

  const favorites = useMemo(
    () => (events ?? []).filter((event) => isFavorite(event.id)),
    [events, isFavorite],
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Mes favoris</h1>
        <p className="mt-2 text-slate-500">
          Les événements que vous avez mis de côté. Conservés sur cet appareil.
        </p>
      </header>

      {error ? (
        <Alert>{error.message}</Alert>
      ) : isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: count || 2 }, (_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : favorites.length ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon="♥"
          title="Aucun favori pour le moment"
          description="Appuyez sur le cœur d'un événement pour le retrouver ici."
          action={
            <Button as="link" to="/evenements" size="lg">
              Parcourir les événements
            </Button>
          }
        />
      )}
    </div>
  )
}
