import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useConfig } from '../../context/ConfigContext'
import { useFavorites } from '../../context/FavoritesContext'
import { BrandMark, Button, cx } from '../ui'
import { HeartIcon, LogoutIcon, SearchIcon, TicketIcon, UserIcon } from '../Icons'

/**
 * Menu en tiroir pour mobiles et tablettes.
 *
 * Un panneau glissant plutôt qu'un dépliant en ligne : sur une tablette,
 * une liste dépliée sous l'en-tête pousse le contenu et laisse l'utilisateur
 * sans repère. Le tiroir se superpose, se ferme au clic sur le voile, à la
 * touche Échap, et à chaque navigation.
 */
export default function MobileMenu({ isOpen, onClose, navItems, query, onQueryChange, onSearch }) {
  const { config } = useConfig()
  const { isAuthenticated, user, signOut } = useAuth()
  const { count } = useFavorites()
  const closeRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return

    function onKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)

    // Empêche le défilement de la page derrière le tiroir.
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Porte le focus dans le panneau : sans cela, la tabulation continuerait
    // dans la page masquée derrière.
    closeRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  /*
   * Rendu par portail dans <body>.
   *
   * Le tiroir est déclaré dans <header>, lequel est `sticky z-40` et forme
   * donc un contexte d'empilement : aucun z-index interne ne peut passer
   * au-dessus des éléments frères de l'en-tête. Le portail extrait le
   * panneau de ce contexte, seule façon de le superposer réellement.
   */
  return createPortal(
    <div className="fixed inset-0 z-60 xl:hidden">
      <button
        type="button"
        aria-label="Fermer le menu"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-slate-900/60 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu principal"
        className="absolute inset-y-0 right-0 flex w-[min(20rem,88vw)] flex-col bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <Link to="/" onClick={onClose} className="flex min-w-0 items-center gap-2">
            <BrandMark src={config.logo} className="h-7 w-auto max-w-24" />
            <span className="truncate text-sm font-bold text-slate-900">
              {config.businessName}
            </span>
          </Link>

          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Fermer le menu"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          <form onSubmit={onSearch} className="border-b border-slate-100 p-4">
            <label className="sr-only" htmlFor="mobile-search">
              Rechercher un événement
            </label>
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="mobile-search"
                type="search"
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                placeholder="Rechercher un événement..."
                className="field pl-9"
              />
            </div>
          </form>

          <nav className="p-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) =>
                  cx(
                    'block rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-700 hover:bg-slate-50',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}

            <Link
              to="/favoris"
              onClick={onClose}
              className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <span className="flex items-center gap-3">
                <HeartIcon className="h-4.5 w-4.5 text-slate-400" /> Mes favoris
              </span>
              {count > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand-600 px-1.5 text-xs font-bold text-white">
                  {count}
                </span>
              )}
            </Link>

            {isAuthenticated && (
              <Link
                to="/mes-reservations"
                onClick={onClose}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <TicketIcon className="h-4.5 w-4.5 text-slate-400" /> Mes réservations
              </Link>
            )}
          </nav>
        </div>

        <div className="border-t border-slate-200 p-4">
          {isAuthenticated ? (
            <>
              <div className="mb-3 flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-600 text-white">
                  <UserIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {user?.name ?? 'Mon compte'}
                  </p>
                  {user?.email && (
                    <p className="truncate text-xs text-slate-500">{user.email}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose()
                  signOut()
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50"
              >
                <LogoutIcon className="h-4 w-4" /> Se déconnecter
              </button>
            </>
          ) : (
            <div className="space-y-2">
              <Button as="link" to="/inscription" size="md" className="w-full" onClick={onClose}>
                Créer un compte
              </Button>
              <Link
                to="/connexion"
                onClick={onClose}
                className="block rounded-xl border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Connexion
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
