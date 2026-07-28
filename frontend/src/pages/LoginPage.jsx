import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Alert, Button, Field } from '../components/ui'
import PasswordInput from '../components/ui/PasswordInput'
import { LockIcon } from '../components/Icons'

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from ?? '/mes-reservations'

  const [form, setForm] = useState({ identifier: '', password: '' })
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setFieldErrors({})
    setIsSubmitting(true)

    try {
      await signIn(form)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err.message)
      setFieldErrors(err.fieldErrors ?? {})
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <div className="card p-8">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
            <LockIcon className="h-6 w-6" />
          </span>
          <h1 className="text-2xl font-bold text-slate-900">Connexion</h1>
          <p className="mt-2 text-sm text-slate-500">
            Accédez à vos réservations et à vos billets.
          </p>
        </div>

        <Alert className="mb-5">{error}</Alert>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Field
            label="Email ou téléphone"
            required
            error={fieldErrors.email_or_phone}
          >
            <input
              type="text"
              required
              autoComplete="username"
              value={form.identifier}
              onChange={(e) => update('identifier', e.target.value)}
              placeholder="votre@email.com"
              className="field"
            />
          </Field>

          <Field label="Mot de passe" required error={fieldErrors.password}>
            <PasswordInput
              required
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              placeholder="••••••••"
            />
          </Field>

          <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
            Se connecter
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Pas encore de compte ?{' '}
          <Link to="/inscription" className="font-semibold text-brand-700 hover:underline">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  )
}
