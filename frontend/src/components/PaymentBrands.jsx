import { useConfig } from '../context/ConfigContext'
import { RemoteIcon } from './ui'
import { CardIcon } from './Icons'

/**
 * Logos des moyens de paiement acceptés, comme sur la maquette de la fiche
 * événement. La liste vient de `active_payment_method_list` : elle reflète ce
 * qui est réellement activé côté serveur, pas une rangée d'icônes décorative.
 */
export default function PaymentBrands({ className }) {
  const { config } = useConfig()
  if (!config.paymentMethods.length) return null

  return (
    <div className={className}>
      <ul className="flex flex-wrap items-center gap-2">
        {config.paymentMethods.map((method) => (
          <li
            key={method.gateway}
            title={method.title}
            className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5"
          >
            <RemoteIcon
              src={method.image}
              className="h-5 w-8"
              fallback={<CardIcon className="h-4 w-4 text-slate-500" />}
            />
            <span className="text-xs font-semibold text-slate-600">{method.title}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
