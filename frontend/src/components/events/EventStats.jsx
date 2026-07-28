import { CalendarIcon, MicIcon, TicketIcon, UsersIcon } from '../Icons'

/**
 * Bande de chiffres clés de la maquette.
 *
 * Les statistiques des maquettes (1200+ participants, 15+ intervenants) sont
 * fictives : on ne montre que ce que l'API fournit réellement, et la bande
 * disparaît si aucun chiffre n'est exploitable.
 */
export default function EventStats({ event }) {
  const stats = []

  if (event.participants > 0) {
    stats.push({
      icon: UsersIcon,
      value: `${event.participants}`,
      label: 'Participants inscrits',
    })
  }

  if (event.organizers.length > 0) {
    const speakers = event.organizers.filter((o) => o.role !== 'Sponsor')
    if (speakers.length > 0) {
      stats.push({
        icon: MicIcon,
        value: `${speakers.length}`,
        label: speakers.length > 1 ? 'Intervenants' : 'Intervenant',
      })
    }
  }

  if (event.tiers.length > 0) {
    stats.push({
      icon: TicketIcon,
      value: `${event.tiers.length}`,
      label: event.tiers.length > 1 ? 'Formules de billet' : 'Formule de billet',
    })
  }

  if (event.totalRemaining > 0) {
    stats.push({
      icon: CalendarIcon,
      value: `${event.totalRemaining}`,
      label: 'Places disponibles',
    })
  }

  if (stats.length < 2) return null

  return (
    <div className="mt-8 grid grid-cols-2 gap-6 border-t border-slate-100 pt-8 sm:grid-cols-4">
      {stats.map(({ icon: Icon, value, label }) => (
        <div key={label} className="flex flex-col items-center text-center">
          <Icon className="h-7 w-7 text-brand-600" />
          <p className="mt-2 text-lg font-bold text-slate-900">{value}</p>
          <p className="text-xs text-slate-500">{label}</p>
        </div>
      ))}
    </div>
  )
}
