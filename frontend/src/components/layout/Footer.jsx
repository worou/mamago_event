import { Link } from 'react-router-dom'
import { useConfig } from '../../context/ConfigContext'
import { BrandMark } from '../ui'
import { HeadsetIcon, MailIcon, RefreshIcon, ShieldIcon, TicketIcon } from '../Icons'

/** Bandeau de réassurance repris des maquettes (bas des pages du tunnel). */
export function TrustStrip() {
  const items = [
    {
      icon: ShieldIcon,
      title: 'Paiement sécurisé',
      text: 'Vos transactions sont 100% sécurisées.',
    },
    {
      icon: TicketIcon,
      title: 'Billet numérique',
      text: 'Recevez votre billet par email.',
    },
    {
      icon: HeadsetIcon,
      title: 'Support 24/7',
      text: 'Notre équipe est disponible à tout moment.',
    },
    {
      icon: RefreshIcon,
      title: 'Annulation facile',
      text: 'Annulation gratuite selon les conditions.',
    },
  ]

  return (
    <div className="card grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-4">
      {items.map(({ icon: Icon, title, text }) => (
        <div key={title} className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-success-50 text-success-600">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">{title}</p>
            <p className="text-xs text-slate-500">{text}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Footer() {
  const { config } = useConfig()

  return (
    <footer className="mt-16 bg-ink-950 text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4 lg:px-8">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 text-white">
            <BrandMark src={config.logo} />
            <span className="text-lg font-bold">{config.businessName}</span>
          </div>
          <p className="mt-4 max-w-sm text-sm text-slate-400">
            La billetterie en ligne des concerts, spectacles, conférences et
            rencontres sportives. Réservez en quelques clics, recevez votre
            billet immédiatement.
          </p>
          {config.address && (
            <p className="mt-4 text-sm text-slate-400">{config.address}</p>
          )}
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold text-white">Navigation</h3>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/" className="hover:text-white">Accueil</Link></li>
            <li><Link to="/evenements" className="hover:text-white">Événements</Link></li>
            <li><Link to="/categories" className="hover:text-white">Catégories</Link></li>
            <li><Link to="/mes-reservations" className="hover:text-white">Mes réservations</Link></li>
            <li><Link to="/a-propos" className="hover:text-white">À propos</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold text-white">Contact</h3>
          <ul className="space-y-2.5 text-sm">
            {config.email && (
              <li className="flex items-center gap-2">
                <MailIcon className="h-4 w-4 shrink-0" />
                <a href={`mailto:${config.email}`} className="hover:text-white">
                  {config.email}
                </a>
              </li>
            )}
            {config.phone && (
              <li className="flex items-center gap-2">
                <HeadsetIcon className="h-4 w-4 shrink-0" />
                <a href={`tel:${config.phone}`} className="hover:text-white">
                  {config.phone}
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} {config.businessName}. Tous droits réservés.
      </div>
    </footer>
  )
}
