import { useState } from 'react'
import { Alert, Button, Field } from '../ui'
import PasswordInput from '../ui/PasswordInput'
import PhoneInput from '../ui/PhoneInput'
import { ArrowLeftIcon, ArrowRightIcon, LockIcon } from '../Icons'

const EMPTY = {
  lastName: '',
  firstName: '',
  phone: '',
  email: '',
  emailConfirm: '',
  password: '',
  passwordConfirm: '',
  acceptTerms: false,
}

/** Au moins 8 caractères, une majuscule, une minuscule et un chiffre. */
function validatePassword(password) {
  if (password.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères.'
  if (!/[A-Z]/.test(password)) return 'Le mot de passe doit contenir une majuscule.'
  if (!/[a-z]/.test(password)) return 'Le mot de passe doit contenir une minuscule.'
  if (!/[0-9]/.test(password)) return 'Le mot de passe doit contenir un chiffre.'
  return null
}

function validate(form) {
  const errors = {}

  if (!form.lastName.trim()) errors.lastName = 'Le nom est requis.'
  if (!form.firstName.trim()) errors.firstName = 'Le prénom est requis.'

  if (!form.phone.trim()) errors.phone = 'Le numéro de téléphone est requis.'
  else if (!/^\+?[0-9\s.-]{6,20}$/.test(form.phone.trim()))
    errors.phone = 'Numéro de téléphone invalide.'

  if (!form.email.trim()) errors.email = "L'email est requis."
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
    errors.email = 'Adresse email invalide.'
  else if (form.email.trim().toLowerCase() !== form.emailConfirm.trim().toLowerCase())
    errors.emailConfirm = 'Les deux adresses email ne correspondent pas.'

  const passwordError = validatePassword(form.password)
  if (passwordError) errors.password = passwordError
  else if (form.password !== form.passwordConfirm)
    errors.passwordConfirm = 'Les deux mots de passe ne correspondent pas.'

  if (!form.acceptTerms)
    errors.acceptTerms = "Vous devez accepter les conditions d'utilisation."

  return errors
}

/**
 * Formulaire d'inscription, partagé entre la page dédiée et l'étape 1 du
 * tunnel de réservation (l'invité crée son compte au moment de commander).
 *
 * L'API n'attend qu'un champ `name` : nom et prénom sont concaténés.
 */
export default function RegistrationForm({
  onSubmit,
  submitLabel = 'Continuer',
  onBack,
  serverError,
  serverFieldErrors = {},
}) {
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      // Ramène l'utilisateur sur le premier champ fautif.
      document.querySelector('[aria-invalid="true"]')?.focus()
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        password: form.password,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const errorFor = (key, apiKey) => errors[key] ?? serverFieldErrors[apiKey ?? key]

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <Alert>{serverError}</Alert>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nom" required error={errorFor('lastName')}>
          <input
            type="text"
            value={form.lastName}
            onChange={(e) => update('lastName', e.target.value)}
            aria-invalid={Boolean(errorFor('lastName'))}
            autoComplete="family-name"
            placeholder="Votre nom"
            className="field"
          />
        </Field>

        <Field label="Prénom" required error={errorFor('firstName')}>
          <input
            type="text"
            value={form.firstName}
            onChange={(e) => update('firstName', e.target.value)}
            aria-invalid={Boolean(errorFor('firstName'))}
            autoComplete="given-name"
            placeholder="Votre prénom"
            className="field"
          />
        </Field>
      </div>

      <Field
        label="Numéro de téléphone"
        required
        error={errorFor('phone')}
        hint="Sélectionnez votre pays, puis saisissez votre numéro sans l'indicatif."
      >
        <PhoneInput
          value={form.phone}
          onChange={(next) => update('phone', next)}
          aria-invalid={Boolean(errorFor('phone'))}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Email" required error={errorFor('email')}>
          <input
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            aria-invalid={Boolean(errorFor('email'))}
            autoComplete="email"
            placeholder="votre@email.com"
            className="field"
          />
        </Field>

        <Field label="Confirmez votre email" required error={errorFor('emailConfirm')}>
          <input
            type="email"
            value={form.emailConfirm}
            onChange={(e) => update('emailConfirm', e.target.value)}
            aria-invalid={Boolean(errorFor('emailConfirm'))}
            onPaste={(e) => e.preventDefault()}
            placeholder="confirmez@email.com"
            className="field"
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Mot de passe" required error={errorFor('password')}>
          <PasswordInput
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            aria-invalid={Boolean(errorFor('password'))}
            autoComplete="new-password"
            placeholder="••••••••••"
          />
        </Field>

        <Field
          label="Confirmez le mot de passe"
          required
          error={errorFor('passwordConfirm')}
        >
          <PasswordInput
            value={form.passwordConfirm}
            onChange={(e) => update('passwordConfirm', e.target.value)}
            aria-invalid={Boolean(errorFor('passwordConfirm'))}
            autoComplete="new-password"
            placeholder="••••••••••"
          />
        </Field>
      </div>

      <p className="flex items-start gap-2 rounded-xl bg-brand-50 px-4 py-3 text-xs text-slate-600">
        <LockIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
        Votre mot de passe doit contenir au moins 8 caractères avec une
        majuscule, une minuscule et un chiffre.
      </p>

      <div>
        <label className="flex items-start gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.acceptTerms}
            onChange={(e) => update('acceptTerms', e.target.checked)}
            aria-invalid={Boolean(errors.acceptTerms)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          <span>
            J'accepte les{' '}
            <a href="#" className="font-medium text-brand-700 hover:underline">
              Conditions d'utilisation
            </a>{' '}
            et la{' '}
            <a href="#" className="font-medium text-brand-700 hover:underline">
              Politique de confidentialité
            </a>{' '}
            <span className="text-rose-500">*</span>
          </span>
        </label>
        {errors.acceptTerms && (
          <p className="mt-1.5 text-xs font-medium text-rose-600" role="alert">
            {errors.acceptTerms}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between gap-4 pt-2">
        {onBack ? (
          <Button type="button" variant="secondary" onClick={onBack}>
            <ArrowLeftIcon className="h-4 w-4" /> Retour
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit" size="lg" isLoading={isSubmitting}>
          {submitLabel} <ArrowRightIcon className="h-4 w-4" />
        </Button>
      </div>
    </form>
  )
}
