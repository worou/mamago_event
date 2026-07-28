import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { TicketIcon } from '../Icons'
import eventBanner from '../../assets/event-banner.svg'

function cx(...parts) {
  return parts.filter(Boolean).join(' ')
}

const VARIANTS = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 focus-visible:outline-brand-600 shadow-sm',
  success:
    'bg-success-600 text-white hover:bg-success-700 focus-visible:outline-success-600 shadow-sm',
  secondary:
    'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50',
  ghost: 'text-brand-700 hover:bg-brand-50',
  outline:
    'border border-brand-600 text-brand-700 bg-white hover:bg-brand-50',
}

const SIZES = {
  sm: 'px-3.5 py-2 text-sm',
  md: 'px-5 py-3 text-sm',
  lg: 'px-6 py-3.5 text-base',
}

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold ' +
  'transition-colors disabled:cursor-not-allowed disabled:opacity-60'

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  as,
  isLoading = false,
  children,
  disabled,
  ...props
}) {
  const classes = cx(BASE, VARIANTS[variant], SIZES[size], className)
  const content = (
    <>
      {isLoading && <Spinner className="h-4 w-4" />}
      {children}
    </>
  )

  if (as === 'link') {
    const { to, ...rest } = props
    return (
      <Link to={to} className={classes} {...rest}>
        {content}
      </Link>
    )
  }

  return (
    <button className={classes} disabled={disabled || isLoading} {...props}>
      {content}
    </button>
  )
}

export function Spinner({ className = 'h-5 w-5' }) {
  return (
    <svg className={cx('animate-spin', className)} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  )
}

export function Badge({ children, tone = 'brand', className }) {
  const tones = {
    brand: 'bg-brand-600 text-white',
    success: 'bg-success-100 text-success-700',
    neutral: 'bg-slate-100 text-slate-700',
    warning: 'bg-amber-100 text-amber-800',
  }
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

export function Field({ label, error, required, hint, children, className }) {
  return (
    <div className={className}>
      {label && (
        <label className="label">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
      {error && (
        <p className="mt-1.5 text-xs font-medium text-rose-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export function Alert({ tone = 'error', children, className }) {
  if (!children) return null
  const tones = {
    error: 'bg-rose-50 text-rose-800 border-rose-200',
    info: 'bg-brand-50 text-brand-800 border-brand-200',
    success: 'bg-success-50 text-success-700 border-success-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
  }
  return (
    <div
      className={cx('rounded-xl border px-4 py-3 text-sm', tones[tone], className)}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      {children}
    </div>
  )
}

export function EmptyState({ title, description, action, icon = '🎫' }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 text-4xl" aria-hidden="true">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      {description && (
        <p className="mt-2 max-w-md text-sm text-slate-500">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="card animate-pulse overflow-hidden">
      <div className="h-44 bg-slate-200" />
      <div className="space-y-3 p-5">
        <div className="h-4 w-3/4 rounded bg-slate-200" />
        <div className="h-3 w-1/2 rounded bg-slate-200" />
        <div className="h-3 w-2/3 rounded bg-slate-200" />
      </div>
    </div>
  )
}

/**
 * Illustration d'événement avec repli.
 *
 * Le repli couvre deux cas : l'absence d'URL, et l'URL qui échoue au
 * chargement — de nombreux médias référencés par l'API sont absents du
 * serveur (404), et sans `onError` le navigateur afficherait son icône
 * d'image cassée.
 *
 * Le visuel de secours est un fichier local (`assets/event-banner.svg`) :
 * il s'affiche donc même hors ligne et ne dépend d'aucun service tiers.
 */
export function EventImage({ src, alt, className }) {
  const [hasFailed, setHasFailed] = useState(false)

  // Une nouvelle source mérite une nouvelle tentative.
  useEffect(() => setHasFailed(false), [src])

  const isFallback = !src || hasFailed

  return (
    <img
      src={isFallback ? eventBanner : src}
      // Le repli est décoratif : il ne décrit pas l'événement.
      alt={isFallback ? '' : alt}
      aria-hidden={isFallback ? 'true' : undefined}
      loading="lazy"
      onError={() => setHasFailed(true)}
      className={cx('object-cover', className)}
    />
  )
}

/** Logo de la plateforme, avec repli sur la pastille de marque. */
export function BrandMark({ src, className = 'h-8 w-auto max-w-32' }) {
  const [hasFailed, setHasFailed] = useState(false)

  useEffect(() => setHasFailed(false), [src])

  if (!src || hasFailed) {
    return (
      <span
        className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white"
        aria-hidden="true"
      >
        <TicketIcon className="h-5 w-5" />
      </span>
    )
  }

  // `object-contain` : le logo de la plateforme est un bloc-marque large,
  // que `object-cover` rognerait en le forçant dans un carré.
  return (
    <img
      src={src}
      alt=""
      onError={() => setHasFailed(true)}
      className={cx('rounded-lg object-contain', className)}
    />
  )
}

/** Portrait rond, avec repli sur l'initiale. */
export function Avatar({ src, name, className = 'h-12 w-12' }) {
  const [hasFailed, setHasFailed] = useState(false)

  useEffect(() => setHasFailed(false), [src])

  if (!src || hasFailed) {
    return (
      <span
        className={cx(
          'grid place-items-center rounded-full bg-brand-50 font-semibold text-brand-700',
          className,
        )}
        aria-hidden="true"
      >
        {name?.trim()?.[0]?.toUpperCase() ?? '?'}
      </span>
    )
  }

  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      onError={() => setHasFailed(true)}
      className={cx('rounded-full object-cover', className)}
    />
  )
}

/** Icône distante qui s'efface si le fichier est absent du serveur. */
export function RemoteIcon({ src, fallback = '🎭', className }) {
  const [hasFailed, setHasFailed] = useState(false)

  useEffect(() => setHasFailed(false), [src])

  if (!src || hasFailed) {
    return (
      <span className={cx('grid place-items-center text-3xl', className)} aria-hidden="true">
        {fallback}
      </span>
    )
  }

  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      onError={() => setHasFailed(true)}
      className={cx('object-contain', className)}
    />
  )
}

export { cx }
