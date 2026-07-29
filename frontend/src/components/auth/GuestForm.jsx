import { useState } from 'react'
import { Button, Field } from '../ui'
import { ArrowLeftIcon, ArrowRightIcon, MailIcon } from '../Icons'

const EMPTY = { lastName: '', firstName: '', email: '', emailConfirm: '' }

function validate(form) {
  const errors = {}

  if (!form.lastName.trim()) errors.lastName = 'Le nom est requis.'
  if (!form.firstName.trim()) errors.firstName = 'Le prénom est requis.'

  if (!form.email.trim()) errors.email = "L'email est requis."
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
    errors.email = 'Adresse email invalide.'
  else if (form.email.trim().toLowerCase() !== form.emailConfirm.trim().toLowerCase())
    errors.emailConfirm = 'Les deux adresses email ne correspondent pas.'

  return errors
}

/**
 * Commande sans compte.
 *
 * La réservation n'exigeant pas de jeton, l'acheteur n'a besoin que de son
 * nom, son prénom et son email — c'est le parcours en deux clics. La
 * confirmation d'email est demandée parce que le billet y est envoyé : une
 * faute de frappe le rendrait irrécupérable.
 */
export default function GuestForm({ onSubmit, onBack }) {
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
      document.querySelector('[aria-invalid="true"]')?.focus()
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        lastName: form.lastName.trim(),
        firstName: form.firstName.trim(),
        email: form.email.trim(),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nom" required error={errors.lastName}>
          <input
            type="text"
            value={form.lastName}
            onChange={(e) => update('lastName', e.target.value)}
            aria-invalid={Boolean(errors.lastName)}
            autoComplete="family-name"
            placeholder="Votre nom"
            className="field"
          />
        </Field>

        <Field label="Prénom" required error={errors.firstName}>
          <input
            type="text"
            value={form.firstName}
            onChange={(e) => update('firstName', e.target.value)}
            aria-invalid={Boolean(errors.firstName)}
            autoComplete="given-name"
            placeholder="Votre prénom"
            className="field"
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Email" required error={errors.email}>
          <input
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            aria-invalid={Boolean(errors.email)}
            autoComplete="email"
            placeholder="votre@email.com"
            className="field"
          />
        </Field>

        <Field label="Confirmez votre email" required error={errors.emailConfirm}>
          <input
            type="email"
            value={form.emailConfirm}
            onChange={(e) => update('emailConfirm', e.target.value)}
            aria-invalid={Boolean(errors.emailConfirm)}
            onPaste={(e) => e.preventDefault()}
            placeholder="confirmez@email.com"
            className="field"
          />
        </Field>
      </div>

      <p className="flex items-start gap-2 rounded-xl bg-brand-50 px-4 py-3 text-xs text-slate-600">
        <MailIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
        Votre billet sera envoyé à cette adresse. Aucun compte n'est créé :
        conservez votre numéro de commande pour retrouver votre réservation.
      </p>

      <div className="flex items-center justify-between gap-4 pt-2">
        {onBack ? (
          <Button type="button" variant="secondary" onClick={onBack}>
            <ArrowLeftIcon className="h-4 w-4" /> Retour
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit" size="lg" isLoading={isSubmitting}>
          Continuer <ArrowRightIcon className="h-4 w-4" />
        </Button>
      </div>
    </form>
  )
}
