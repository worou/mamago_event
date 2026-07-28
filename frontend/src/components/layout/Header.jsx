import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useConfig } from '../../context/ConfigContext'
import { useFavorites } from '../../context/FavoritesContext'
import MobileMenu from './MobileMenu'
import { BrandMark, Button, cx } from '../ui'
import {
  ChevronDownIcon,
  HeartIcon,
  LogoutIcon,
  SearchIcon,
  TicketIcon,
  UserIcon,
} from '../Icons'

const NAV = [
  { to: '/', label: 'Accueil', end: true },
  { to: '/evenements', label: 'Événements' },
  { to: '/categories', label: 'Catégories' },
  { to: '/lieux', label: 'Lieux' },
  { to: '/a-propos', label: 'À propos' },
]

/**
 * Les maquettes alternent deux traitements : fond sombre sur l'accueil, la
 * fiche événement et le billet ; fond clair sur les étapes du tunnel.
 */
const LIGHT_ROUTES = ['/reservation', '/connexion', '/inscription', '/mes-reservations']

function useTheme() {
  const { pathname } = useLocation()
  const isLight = LIGHT_ROUTES.some((route) => pathname.startsWith(route))

  return isLight
    ? {
        isLight: true,
        bar: 'bg-white border-slate-200 text-slate-900',
        link: 'text-slate-600 hover:text-slate-900',
        linkActive: 'text-brand-700',
        icon: 'text-slate-500 hover:bg-slate-100 hover:text-slate-900',
        search:
          'border-slate-200 bg-slate-100 text-slate-900 placeholder:text-slate-400 focus:bg-white',
        chip: 'bg-slate-100 text-slate-800 hover:bg-slate-200',
      }
    : {
        isLight: false,
        bar: 'bg-ink-950 border-slate-800 text-white',
        link: 'text-slate-300 hover:text-white',
        linkActive: 'text-white',
        icon: 'text-slate-300 hover:bg-slate-800 hover:text-white',
        search:
          'border-slate-700 bg-slate-800/80 text-white placeholder:text-slate-400 focus:border-brand-500',
        chip: 'bg-slate-800 text-white hover:bg-slate-700',
      }
}

function AccountMenu({ theme }) {
  const { user, signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef(null)

  // Fermeture au clic extérieur et à l'échappement.
  useEffect(() => {
    if (!isOpen) return

    function onPointerDown(event) {
      if (!ref.current?.contains(event.target)) setIsOpen(false)
    }
    function onKeyDown(event) {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={cx(
          'flex items-center gap-2 rounded-full py-1.5 pr-2 pl-1.5 text-sm font-medium transition-colors',
          theme.chip,
        )}
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-600 text-white">
          <UserIcon className="h-4 w-4" />
        </span>
        <span className="hidden max-w-[12ch] truncate lg:block">
          {user?.name ?? 'Mon compte'}
        </span>
        <ChevronDownIcon className="h-4 w-4" />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white py-2 text-slate-700 shadow-lg"
        >
          <div className="border-b border-slate-100 px-4 pt-1 pb-3">
            <p className="truncate font-semibold text-slate-900">
              {user?.name ?? 'Mon compte'}
            </p>
            {user?.email && (
              <p className="truncate text-xs text-slate-500">{user.email}</p>
            )}
          </div>

          <Link
            to="/mes-reservations"
            role="menuitem"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50"
          >
            <TicketIcon className="h-4 w-4 text-slate-400" /> Mes réservations
          </Link>
          <Link
            to="/favoris"
            role="menuitem"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50"
          >
            <HeartIcon className="h-4 w-4 text-slate-400" /> Mes favoris
          </Link>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setIsOpen(false)
              signOut()
            }}
            className="flex w-full items-center gap-3 border-t border-slate-100 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50"
          >
            <LogoutIcon className="h-4 w-4" /> Se déconnecter
          </button>
        </div>
      )}
    </div>
  )
}

export default function Header() {
  const theme = useTheme()
  const { config } = useConfig()
  const { isAuthenticated } = useAuth()
  const { count } = useFavorites()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  function handleSearch(event) {
    event.preventDefault()
    const trimmed = query.trim()
    navigate(trimmed ? `/evenements?q=${encodeURIComponent(trimmed)}` : '/evenements')
    setIsMenuOpen(false)
  }

  return (
    <header className={cx('sticky top-0 z-40 border-b', theme.bar)}>
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex min-w-0 shrink items-center gap-2 font-bold">
          <BrandMark src={config.logo} />
          <span className="hidden truncate text-lg tracking-tight sm:block">
            {config.businessName}
          </span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 xl:flex">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cx(
                  'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? theme.linkActive : theme.link,
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <form onSubmit={handleSearch} className="ml-auto hidden max-w-xs flex-1 lg:block">
          <label className="sr-only" htmlFor="header-search">
            Rechercher un événement
          </label>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="header-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un événement..."
              className={cx(
                'w-full rounded-full border py-2 pr-4 pl-9 text-sm focus:outline-none',
                theme.search,
              )}
            />
          </div>
        </form>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 lg:ml-0">
          <Link
            to="/favoris"
            title="Mes favoris"
            className={cx('relative hidden rounded-lg p-2 md:block', theme.icon)}
          >
            <HeartIcon className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute top-1 right-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
                {count}
              </span>
            )}
            <span className="sr-only">Mes favoris</span>
          </Link>

          {isAuthenticated ? (
            <span className="hidden lg:block">
              <AccountMenu theme={theme} />
            </span>
          ) : (
            <>
              <Link
                to="/connexion"
                className={cx('hidden rounded-lg px-3 py-2 text-sm font-medium lg:block', theme.link)}
              >
                Connexion
              </Link>
              <Button as="link" to="/inscription" size="sm" className="hidden lg:inline-flex">
                Créer un compte
              </Button>
            </>
          )}

          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-expanded={isMenuOpen}
            aria-label="Ouvrir le menu"
            className={cx('shrink-0 rounded-lg p-2 xl:hidden', theme.icon)}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      <MobileMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        navItems={NAV}
        query={query}
        onQueryChange={setQuery}
        onSearch={handleSearch}
      />
    </header>
  )
}
