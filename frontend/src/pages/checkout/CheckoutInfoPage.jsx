import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useBooking } from '../../context/BookingContext'
import { useConfig } from '../../context/ConfigContext'
import { formatMoney } from '../../lib/money'
import RegistrationForm from '../../components/auth/RegistrationForm'
import GuestForm from '../../components/auth/GuestForm'
import Stepper from '../../components/checkout/Stepper'
import EventSummaryCard from '../../components/checkout/EventSummaryCard'
import { TrustStrip } from '../../components/layout/Footer'
import { Alert, Button, Field, cx } from '../../components/ui'
import PasswordInput from '../../components/ui/PasswordInput'
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, UserIcon } from '../../components/Icons'

/** Connexion en ligne, pour l'acheteur qui a déjà un compte. */
function InlineLogin({ onDone, onBack }) {
  const { signIn } = useAuth()
  const [form, setForm] = useState({ identifier: '', password: '' })
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await signIn(form)
      onDone()
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Alert>{error}</Alert>

      <Field label="Email ou téléphone" required>
        <input
          type="text"
          required
          autoComplete="username"
          value={form.identifier}
          onChange={(e) => setForm((p) => ({ ...p, identifier: e.target.value }))}
          placeholder="votre@email.com"
          className="field"
        />
      </Field>

      <Field label="Mot de passe" required>
        <PasswordInput
          required
          autoComplete="current-password"
          value={form.password}
          onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
          placeholder="••••••••"
        />
      </Field>

      <div className="flex items-center justify-between gap-4 pt-2">
        <Button type="button" variant="secondary" onClick={onBack}>
          <ArrowLeftIcon className="h-4 w-4" /> Retour
        </Button>
        <Button type="submit" size="lg" isLoading={isSubmitting}>
          Se connecter <ArrowRightIcon className="h-4 w-4" />
        </Button>
      </div>
    </form>
  )
}

export default function CheckoutInfoPage() {
  const navigate = useNavigate()
  const { config } = useConfig()
  const { isAuthenticated, user, signUp } = useAuth()
  const { event, lines, subtotal, hasSelection, setGuest } = useBooking()

  const [mode, setMode] = useState('register')
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})

  // Sans sélection en cours, l'étape n'a pas de sens.
  if (!event || !hasSelection) {
    return <Navigate to="/evenements" replace />
  }

  /** L'invité poursuit sans compte : ses coordonnées suivent la commande. */
  function handleGuest(details) {
    setGuest(details)
    navigate('/reservation/paiement')
  }

  async function handleRegister(form) {
    setError(null)
    setFieldErrors({})

    try {
      const result = await signUp(form)
      if (!result.token) {
        setError(
          "Votre compte a été créé mais nécessite une vérification. Connectez-vous pour poursuivre votre réservation.",
        )
        setMode('login')
        return
      }
      navigate('/reservation/paiement')
    } catch (err) {
      setError(err.message)
      setFieldErrors(err.fieldErrors ?? {})
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Stepper current={1} />

      <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
        <EventSummaryCard event={event} />

        <div className="card p-6 sm:p-8">
          {isAuthenticated ? (
            <>
              <h1 className="text-2xl font-bold text-slate-900">
                Vérifiez vos informations
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Vous êtes connecté. Vérifiez votre commande avant de passer au
                paiement.
              </p>

              <div className="mt-6 flex items-center gap-4 rounded-xl bg-brand-50 p-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-600 text-white">
                  <UserIcon className="h-6 w-6" />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">
                    {user?.name ?? 'Mon compte'}
                  </p>
                  {user?.email && (
                    <p className="truncate text-sm text-slate-500">{user.email}</p>
                  )}
                  {user?.phone && (
                    <p className="text-sm text-slate-500">{user.phone}</p>
                  )}
                </div>
              </div>

              <h2 className="mt-8 mb-3 text-sm font-semibold text-slate-900">
                Récapitulatif de votre sélection
              </h2>
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                {lines.map(({ tier, quantity, total }) => (
                  <li key={tier.id} className="flex items-center justify-between gap-4 p-4">
                    <div>
                      <p className="font-medium text-slate-900">{tier.type}</p>
                      <p className="text-sm text-slate-500">
                        {quantity} × {formatMoney(tier.price, config)}
                      </p>
                    </div>
                    <p className="font-semibold text-slate-900">
                      {formatMoney(total, config)}
                    </p>
                  </li>
                ))}
                <li className="flex items-center justify-between p-4">
                  <span className="font-semibold text-slate-900">Sous-total</span>
                  <span className="text-lg font-bold text-brand-700">
                    {formatMoney(subtotal, config)}
                  </span>
                </li>
              </ul>

              <div className="mt-8 flex items-center justify-between gap-4">
                <Button
                  variant="secondary"
                  onClick={() => navigate(`/evenements/${event.id}`)}
                >
                  <ArrowLeftIcon className="h-4 w-4" /> Retour
                </Button>
                <Button size="lg" onClick={() => navigate('/reservation/paiement')}>
                  Continuer <ArrowRightIcon className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-slate-900">
                {mode === 'guest'
                  ? 'Vos coordonnées – Réservez votre billet'
                  : mode === 'register'
                    ? 'Inscription – Réservez votre billet'
                    : 'Connexion – Réservez votre billet'}
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                {mode === 'guest'
                  ? 'Trois informations suffisent : aucun compte n’est nécessaire.'
                  : mode === 'register'
                    ? 'Créez votre compte pour retrouver vos billets à tout moment.'
                    : 'Connectez-vous pour poursuivre votre réservation.'}
              </p>

              <div className="mt-6 mb-8 flex gap-2 rounded-xl bg-slate-100 p-1">
                {[
                  { id: 'register', label: "S'inscrire" },
                  { id: 'guest', label: 'Sans compte' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setMode(tab.id)
                      setError(null)
                    }}
                    className={cx(
                      'flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors',
                      mode === tab.id
                        ? 'bg-white text-brand-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900',
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {mode === 'guest' ? (
                <GuestForm
                  onSubmit={handleGuest}
                  onBack={() => navigate(`/evenements/${event.id}`)}
                />
              ) : mode === 'register' ? (
                <>
                  <Alert tone="info" className="mb-6">
                    Un compte vous permet de retrouver vos billets et de suivre
                    vos commandes. Ce n'est pas obligatoire pour réserver.
                  </Alert>
                  <RegistrationForm
                    onSubmit={handleRegister}
                    submitLabel="Continuer"
                    onBack={() => navigate(`/evenements/${event.id}`)}
                    serverError={error}
                    serverFieldErrors={fieldErrors}
                  />
                </>
              ) : (
                <>
                  {error && <Alert className="mb-6">{error}</Alert>}
                  <InlineLogin
                    onDone={() => navigate('/reservation/paiement')}
                    onBack={() => navigate(`/evenements/${event.id}`)}
                  />
                </>
              )}
            </>
          )}
        </div>
      </div>

      <div className="mt-10">
        <TrustStrip />
      </div>

      <p className="mt-6 text-center text-sm text-slate-500">
        <CheckIcon className="mr-1 inline h-4 w-4 text-success-600" />
        Vos données sont chiffrées et ne sont jamais partagées.{' '}
        <Link to="/a-propos" className="font-medium text-brand-700 hover:underline">
          En savoir plus
        </Link>
      </p>
    </div>
  )
}
