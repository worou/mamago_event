import { Link } from 'react-router-dom'
import { fetchCategories, fetchEvents } from '../api/services'
import { useAsync } from '../hooks/useAsync'
import { Alert, EmptyState, RemoteIcon, SkeletonCard } from '../components/ui'

export default function CategoriesPage() {
  const { data: categories, error, isLoading } = useAsync((signal) => fetchCategories(signal))
  const { data: events } = useAsync((signal) => fetchEvents(signal))

  function countFor(title) {
    return (events ?? []).filter((e) => e.category === title).length
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Catégories</h1>
        <p className="mt-2 text-slate-500">
          Parcourez les événements par type et trouvez votre prochaine sortie.
        </p>
      </header>

      {error ? (
        <Alert>{error.message}</Alert>
      ) : isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : categories?.length ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => {
            const count = countFor(category.title)
            return (
              <Link
                key={category.id}
                to={`/evenements?categorie=${encodeURIComponent(category.title)}`}
                className="card flex flex-col items-center gap-4 p-8 transition-shadow hover:shadow-md"
              >
                <RemoteIcon src={category.image} className="h-16 w-16" />
                <div className="text-center">
                  <p className="font-semibold text-slate-900">{category.title}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {count} événement{count > 1 ? 's' : ''}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <EmptyState title="Aucune catégorie disponible" />
      )}
    </div>
  )
}
