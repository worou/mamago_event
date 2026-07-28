import { useConfig } from '../../context/ConfigContext'
import { formatMoney } from '../../lib/money'
import { QuestionIcon } from '../Icons'

/**
 * « 1. Récapitulatif de la commande » — le tableau de la maquette.
 * La quantité reste modifiable ici, comme sur l'écran d'origine.
 */
export default function OrderTable({ lines, onQuantityChange, serviceFee, total }) {
  const { config } = useConfig()

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs tracking-wide text-slate-500 uppercase">
              <th scope="col" className="px-3 py-2.5 font-medium">Type</th>
              <th scope="col" className="px-3 py-2.5 font-medium">Prix unit.</th>
              <th scope="col" className="px-3 py-2.5 font-medium">Qté</th>
              <th scope="col" className="px-3 py-2.5 text-right font-medium">Total</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {lines.map(({ tier, quantity, total: lineTotal }) => (
              <tr key={tier.id}>
                <td className="px-3 py-3">
                  <p className="font-semibold text-slate-900">{tier.type}</p>
                  {tier.info && <p className="text-xs text-slate-500">{tier.info}</p>}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-slate-700">
                  {formatMoney(tier.price, config)}
                </td>
                <td className="px-3 py-3">
                  <div className="inline-flex items-center gap-1 rounded-lg border border-slate-300 p-1">
                    <button
                      type="button"
                      onClick={() => onQuantityChange(tier.id, quantity - 1)}
                      aria-label={`Retirer un billet ${tier.type}`}
                      className="grid h-6 w-6 place-items-center rounded text-slate-600 hover:bg-slate-100"
                    >
                      −
                    </button>
                    <span className="w-6 text-center font-semibold tabular-nums" aria-live="polite">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => onQuantityChange(tier.id, quantity + 1)}
                      disabled={quantity >= tier.remaining}
                      aria-label={`Ajouter un billet ${tier.type}`}
                      className="grid h-6 w-6 place-items-center rounded text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                </td>
                <td className="px-3 py-3 text-right font-semibold whitespace-nowrap text-slate-900">
                  {formatMoney(lineTotal, config)}
                </td>
              </tr>
            ))}

            {/* Ligne affichée uniquement si le serveur active des frais. */}
            {serviceFee > 0 && (
              <tr>
                <td colSpan={3} className="px-3 py-2.5">
                  <span className="inline-flex items-center gap-1.5 text-slate-600">
                    {config.serviceFee.label}
                    <QuestionIcon className="h-4 w-4 text-slate-400" />
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right whitespace-nowrap text-slate-700">
                  {formatMoney(serviceFee, config)}
                </td>
              </tr>
            )}
          </tbody>

          <tfoot>
            <tr className="border-t-2 border-slate-200">
              <td colSpan={3} className="px-3 py-3 font-bold tracking-wide text-slate-900 uppercase">
                Total
              </td>
              <td className="px-3 py-3 text-right text-lg font-bold whitespace-nowrap text-brand-700">
                {formatMoney(total, config)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
