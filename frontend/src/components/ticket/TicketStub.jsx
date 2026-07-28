import { useEffect, useState } from 'react'
import { buildQrPayload, generateQrDataUrl } from '../../lib/ticket'
import { Spinner } from '../ui'

/** Billet détachable avec QR code, repris des maquettes de confirmation. */
export default function TicketStub({ ticket, event, rows }) {
  const [qr, setQr] = useState(null)
  const [hasFailed, setHasFailed] = useState(false)

  useEffect(() => {
    let isActive = true

    generateQrDataUrl(buildQrPayload(ticket))
      .then((url) => {
        if (isActive) setQr(url)
      })
      .catch(() => {
        if (isActive) setHasFailed(true)
      })

    return () => {
      isActive = false
    }
  }, [ticket])

  const details = rows ?? [
    ['N° de commande', ticket.reference || '—'],
    ['Type de billet', ticket.type],
    ['Quantité', String(ticket.quantity)],
    ['Date', event?.dateLabel || '—'],
    ['Lieu', event?.location || '—'],
  ]

  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:flex-row">
      <div className="flex items-center justify-center border-slate-200 p-6 sm:border-r sm:border-dashed">
        {qr ? (
          <img
            src={qr}
            alt={`QR code du billet ${ticket.reference}`}
            className="h-44 w-44"
          />
        ) : hasFailed ? (
          <div className="grid h-44 w-44 place-items-center rounded-xl bg-slate-100 p-4 text-center text-xs text-slate-500">
            QR code indisponible. Présentez votre numéro de commande à l'entrée.
          </div>
        ) : (
          <div className="grid h-44 w-44 place-items-center">
            <Spinner className="h-6 w-6 text-brand-600" />
          </div>
        )}
      </div>

      <dl className="flex-1 space-y-3 p-6">
        {details.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-slate-500">{label}</dt>
            <dd
              className={
                label.startsWith('N°')
                  ? 'font-semibold text-brand-700'
                  : 'font-medium text-slate-900'
              }
            >
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
