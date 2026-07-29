import { CardElement } from '@stripe/react-stripe-js'
import { Field } from '../ui'
import { LockIcon, ShieldIcon } from '../Icons'

/**
 * Saisie de la carte.
 *
 * `CardElement` est une iframe servie par Stripe : le numéro de carte
 * n'entre jamais dans le DOM de cette application, ni dans son bundle, ni
 * dans les journaux du serveur. C'est ce qui permet d'afficher enfin les
 * champs de la maquette sans manipuler soi-même de données bancaires.
 */
const ELEMENT_STYLE = {
  style: {
    base: {
      fontSize: '15px',
      color: '#0f172a',
      fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
      '::placeholder': { color: '#94a3b8' },
    },
    invalid: { color: '#e11d48', iconColor: '#e11d48' },
  },
}

export default function StripeCardForm({ holderName, onHolderNameChange, error }) {
  return (
    <div className="rounded-xl border border-slate-200 p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="font-semibold text-slate-900">Paiement par carte bancaire</p>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
          <LockIcon className="h-3.5 w-3.5" /> Sécurisé par Stripe
        </span>
      </div>

      <Field label="Nom sur la carte" className="mb-4">
        <input
          type="text"
          value={holderName}
          onChange={(e) => onHolderNameChange(e.target.value)}
          autoComplete="cc-name"
          placeholder="CEDRIC NGOUYOMBO"
          className="field uppercase"
        />
      </Field>

      <Field label="Coordonnées bancaires" error={error}>
        <div className="rounded-xl border border-slate-300 bg-white px-4 py-3.5 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100">
          <CardElement options={ELEMENT_STYLE} />
        </div>
      </Field>

      <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4 text-center">
        {[
          ['Chiffrement', 'SSL'],
          ['Confirmation', 'Instantanée'],
          ['Protection', 'Des données'],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-slate-500">{label}</dt>
            <dd className="text-sm font-semibold text-slate-800">{value}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-4 flex items-start gap-2 text-xs text-slate-500">
        <ShieldIcon className="mt-0.5 h-4 w-4 shrink-0 text-success-600" />
        Vos coordonnées bancaires sont transmises directement à Stripe et ne
        transitent jamais par ce site.
      </p>
    </div>
  )
}
