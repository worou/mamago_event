import { useConfig } from '../context/ConfigContext'
import { TrustStrip } from '../components/layout/Footer'
import { Button } from '../components/ui'

export default function AboutPage() {
  const { config } = useConfig()

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-slate-900">À propos de {config.businessName}</h1>

      <div className="mt-6 space-y-4 text-slate-600">
        <p>
          {config.businessName} est une plateforme de billetterie en ligne qui
          réunit concerts, spectacles, rencontres sportives et conférences.
          Notre objectif est simple : rendre la réservation d'un billet aussi
          rapide et sûre que possible.
        </p>
        <p>
          Réservez en quelques clics, avec ou sans compte. Votre billet, muni
          d'un QR code unique, est disponible immédiatement au téléchargement
          et vous est également envoyé par email.
        </p>
      </div>

      <div className="mt-10">
        <TrustStrip />
      </div>

      <section className="card mt-10 p-8">
        <h2 className="text-xl font-bold text-slate-900">Nous contacter</h2>
        <dl className="mt-4 space-y-3 text-sm text-slate-600">
          {config.address && (
            <div>
              <dt className="font-medium text-slate-900">Adresse</dt>
              <dd>{config.address}</dd>
            </div>
          )}
          {config.email && (
            <div>
              <dt className="font-medium text-slate-900">Email</dt>
              <dd>
                <a href={`mailto:${config.email}`} className="text-brand-700 hover:underline">
                  {config.email}
                </a>
              </dd>
            </div>
          )}
          {config.phone && (
            <div>
              <dt className="font-medium text-slate-900">Téléphone</dt>
              <dd>
                <a href={`tel:${config.phone}`} className="text-brand-700 hover:underline">
                  {config.phone}
                </a>
              </dd>
            </div>
          )}
        </dl>
      </section>

      <div className="mt-10 text-center">
        <Button as="link" to="/evenements" size="lg">
          Découvrir les événements
        </Button>
      </div>
    </div>
  )
}
