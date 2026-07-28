import { useConfig } from '../../context/ConfigContext'
import { formatPrice } from '../../lib/money'
import { cx } from '../ui'

function QuantityStepper({ value, onChange, max, disabled }) {
  return (
    <div className="flex shrink-0 items-center gap-1 rounded-xl border border-slate-300 bg-white p-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(value - 1, 0))}
        disabled={disabled || value <= 0}
        aria-label="Retirer un billet"
        className="grid h-8 w-8 place-items-center rounded-lg text-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40"
      >
        −
      </button>
      <span className="w-8 text-center text-sm font-semibold tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(value + 1, max))}
        disabled={disabled || value >= max}
        aria-label="Ajouter un billet"
        className="grid h-8 w-8 place-items-center rounded-lg text-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40"
      >
        +
      </button>
    </div>
  )
}

/**
 * Grille tarifaire. Le maximum par catégorie vient du stock restant
 * (quota - déjà vendus) renvoyé par l'API.
 */
export default function TicketTierSelector({ tiers, quantities, onChange }) {
  const { config } = useConfig()

  if (!tiers.length) {
    return (
      <p className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
        Aucune catégorie de billet n'est proposée pour cet événement.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {tiers.map((tier) => {
        const quantity = quantities[tier.id] ?? 0
        const isSelected = quantity > 0

        return (
          <div
            key={tier.id}
            className={cx(
              'flex items-center gap-4 rounded-xl border p-4 transition-colors',
              isSelected ? 'border-brand-500 bg-brand-50/50' : 'border-slate-200',
              !tier.isAvailable && 'opacity-60',
            )}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-semibold text-slate-900">{tier.type}</p>
                <p className="shrink-0 font-bold text-slate-900">
                  {formatPrice(tier.price, config)}
                </p>
              </div>
              {tier.info && (
                <p className="mt-1 text-sm text-slate-500">{tier.info}</p>
              )}
              {!tier.isAvailable ? (
                <p className="mt-1 text-xs font-medium text-rose-600">Épuisé</p>
              ) : (
                tier.remaining <= 10 && (
                  <p className="mt-1 text-xs font-medium text-amber-600">
                    Plus que {tier.remaining} place{tier.remaining > 1 ? 's' : ''}
                  </p>
                )
              )}
            </div>

            <QuantityStepper
              value={quantity}
              max={tier.remaining}
              disabled={!tier.isAvailable}
              onChange={(next) => onChange(tier.id, next)}
            />
          </div>
        )
      })}
    </div>
  )
}
