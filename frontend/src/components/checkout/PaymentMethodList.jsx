import { RemoteIcon, cx } from '../ui'
import { CardIcon, CheckIcon, TicketIcon } from '../Icons'

/**
 * Le sélecteur est construit à partir de `active_payment_method_list` renvoyé
 * par /api/v1/config : activer une passerelle supplémentaire (PayPal, Mobile
 * Money…) côté administration la fait apparaître ici sans modification du
 * frontend.
 */
export default function PaymentMethodList({ methods, selected, onSelect }) {
  if (!methods.length) {
    return (
      <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Aucun moyen de paiement n'est actuellement activé. Contactez le support
        pour finaliser votre réservation.
      </p>
    )
  }

  return (
    <div className="space-y-3" role="radiogroup" aria-label="Moyen de paiement">
      {methods.map((method) => {
        const isSelected = selected === method.id

        return (
          <label
            key={method.id}
            className={cx(
              'flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-colors',
              isSelected
                ? 'border-brand-600 bg-brand-50/40 ring-1 ring-brand-600'
                : 'border-slate-200 hover:border-slate-300',
            )}
          >
            <input
              type="radio"
              name="payment-method"
              value={method.id}
              checked={isSelected}
              onChange={() => onSelect(method.id)}
              className="h-4 w-4 shrink-0 text-brand-600 focus:ring-brand-500"
            />

            <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-100">
              <RemoteIcon
                src={method.image}
                className="h-full w-full p-1"
                fallback={
                  method.isOffline ? (
                    <TicketIcon className="h-5 w-5 text-slate-600" />
                  ) : (
                    <CardIcon className="h-5 w-5 text-slate-600" />
                  )
                }
              />
            </span>

            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-slate-900">{method.title}</span>
              <span className="block text-sm text-slate-500">{method.description}</span>
            </span>

            {isSelected && (
              <CheckIcon className="h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
            )}
          </label>
        )
      })}
    </div>
  )
}
