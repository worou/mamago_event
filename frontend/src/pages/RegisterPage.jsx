import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import RegistrationForm from '../components/auth/RegistrationForm'
import { Alert } from '../components/ui'

export default function RegisterPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [needsLogin, setNeedsLogin] = useState(false)

  async function handleSubmit(form) {
    setError(null)
    setFieldErrors({})
    setNeedsLogin(false)

    try {
      const result = await signUp(form)

      // Sans jeton, l'installation exige une vérification préalable :
      // on redirige vers la connexion plutôt que de bloquer l'utilisateur.
      if (!result.token) {
        setNeedsLogin(true)
        return
      }
      navigate('/mes-reservations', { replace: true })
    } catch (err) {
      setError(err.message)
      setFieldErrors(err.fieldErrors ?? {})
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="card p-8">
        <h1 className="text-2xl font-bold text-slate-900">Créer un compte</h1>
        <p className="mt-2 text-sm text-slate-500">
          Créez votre compte pour réserver vos billets et retrouver toutes vos
          commandes au même endroit.
        </p>

        {needsLogin && (
          <Alert tone="success" className="mt-6">
            Votre compte a été créé. Vous pouvez maintenant vous connecter.{' '}
            <Link to="/connexion" className="font-semibold underline">
              Aller à la connexion
            </Link>
          </Alert>
        )}

        <div className="mt-8">
          <RegistrationForm
            onSubmit={handleSubmit}
            submitLabel="Créer mon compte"
            serverError={error}
            serverFieldErrors={fieldErrors}
          />
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Vous avez déjà un compte ?{' '}
          <Link to="/connexion" className="font-semibold text-brand-700 hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}
