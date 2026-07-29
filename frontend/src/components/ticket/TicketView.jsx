import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useConfig } from '../../context/ConfigContext'
import { formatMoney } from '../../lib/money'
import { downloadTicketPdf } from '../../lib/ticket'
import TicketStub from './TicketStub'
import CalendarButtons from './CalendarButtons'
import ShareButton from './ShareButton'
import { Badge, Button, EventImage } from '../ui'
import {
  CalendarIcon,
  ClockIcon,
  DownloadIcon,
  HeadsetIcon,
  LockIcon,
  PinIcon,
  QuestionIcon,
  ShieldIcon,
} from '../Icons'

/**
 * Écran du billet, partagé par l'étape 4 du tunnel et la consultation
 * depuis « Mes réservations ».
 *
 * Les deux affichent exactement la même chose ; seule diffère la
 * provenance des données — le brouillon de commande d'un côté, l'API de
 * l'autre — et l'action de retour.
 */
export default function TicketView({ ticket, event, buyerName, actions }) {
  const { config } = useConfig()
  const [isDownloading, setIsDownloading] = useState(false)

  async function handleDownload() {
    setIsDownloading(true)
    try {
      await downloadTicketPdf({ ticket, event, config })
    } finally {
      setIsDownloading(false)
    }
  }

  const isPending = String(ticket.status).toLowerCase() === 'pending'

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[320px_1fr_320px]">
        {/* Colonne événement */}
        <div className="space-y-4">
          {event && (
            <div className="overflow-hidden rounded-2xl bg-ink-950 text-white">
              <div className="relative h-40">
                <EventImage src={event.image} alt={event.title} className="h-full w-full" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950 to-transparent" />
                {event.category && (
                  <span className="absolute top-3 left-3">
                    <Badge>{event.category}</Badge>
                  </span>
                )}
              </div>
              <div className="p-5">
                <h2 className="text-lg font-bold">{event.title}</h2>
                <dl className="mt-4 space-y-3 text-sm">
                  {event.dateLabel && (
                    <div className="flex items-center gap-3">
                      <CalendarIcon className="h-4 w-4 shrink-0 text-slate-400" />
                      <dd>{event.dateLabel}</dd>
                    </div>
                  )}
                  {event.timeLabel && (
                    <div className="flex items-center gap-3">
                      <ClockIcon className="h-4 w-4 shrink-0 text-slate-400" />
                      <dd>{event.timeLabel}</dd>
                    </div>
                  )}
                  {(event.venue?.title || event.location) && (
                    <div className="flex items-start gap-3">
                      <PinIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                      <dd>
                        {event.venue?.title && (
                          <span className="block font-medium">{event.venue.title}</span>
                        )}
                        {event.location}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          )}

          <div className="card flex items-start gap-3 p-5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <HeadsetIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">Besoin d'aide ?</p>
              <p className="mt-1 text-xs text-slate-500">
                Notre service client est disponible 7j/7 pour vous accompagner.
              </p>
            </div>
          </div>
        </div>

        {/* Colonne billet */}
        <div className="card p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-brand-700">Votre billet</h2>
            <Badge tone={isPending ? 'warning' : 'success'}>
              {isPending ? 'En attente' : 'Confirmé'}
            </Badge>
          </div>

          <TicketStub
            ticket={ticket}
            event={event}
            rows={[
              ['N° de commande', String(ticket.reference || '—')],
              ['Nom', buyerName || '—'],
              ['Type de billet', ticket.type],
              ['Quantité', String(ticket.quantity)],
              ...(ticket.unitPrice > 0
                ? [['Prix unitaire', formatMoney(ticket.unitPrice, config)]]
                : []),
              ...(ticket.totalPrice > 0
                ? [['Total payé', formatMoney(ticket.totalPrice, config)]]
                : []),
            ]}
          />

          <div className="mt-6 flex items-start gap-3 rounded-xl bg-brand-50 p-4">
            <ShieldIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
            <p className="text-sm text-slate-700">
              <span className="font-semibold">Comment utiliser votre billet ?</span>
              <br />
              Présentez ce QR code à l'entrée de l'événement. Vous pouvez
              l'imprimer ou le montrer depuis votre téléphone.
            </p>
          </div>

          <p className="mt-6 text-center font-semibold text-brand-700">
            Merci et à très bientôt !
          </p>
        </div>

        {/* Colonne actions */}
        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <DownloadIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Télécharger votre billet
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Téléchargez votre billet au format PDF pour l'imprimer ou le
                  conserver.
                </p>
              </div>
            </div>

            {ticket.pdfUrl ? (
              // PDF servi par le backend : lien direct, hors routage client.
              <a
                href={ticket.pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-brand-600 bg-white px-5 py-3 text-sm font-semibold text-brand-700 hover:bg-brand-50"
              >
                <DownloadIcon className="h-5 w-5" /> Télécharger le billet (PDF)
              </a>
            ) : (
              <Button
                variant="outline"
                className="mt-4 w-full"
                onClick={handleDownload}
                isLoading={isDownloading}
              >
                <DownloadIcon className="h-5 w-5" /> Télécharger le billet (PDF)
              </Button>
            )}
          </div>

          {event && (
            <div className="card p-5">
              <p className="text-sm font-semibold text-slate-900">
                Ajouter à votre calendrier
              </p>
              <p className="mt-1 mb-4 text-xs text-slate-500">
                Ajoutez cet événement à votre calendrier pour ne pas l'oublier.
              </p>
              <CalendarButtons event={event} variant="grid" />
            </div>
          )}

          {event && (
            <div className="card p-5">
              <p className="mb-3 text-sm font-semibold text-slate-900">
                Partager l'événement
              </p>
              <ShareButton event={event} size="md" className="w-full" />
            </div>
          )}

          {actions}
        </div>
      </div>

      {/* Bandeau de réassurance en pied de page, comme sur la maquette. */}
      <div className="card mt-10 grid gap-6 p-6 sm:grid-cols-3">
        {[
          {
            icon: ShieldIcon,
            title: 'Billet sécurisé',
            text: "Ce billet est unique et non transférable. Toute reproduction peut être refusée à l'entrée.",
          },
          {
            icon: QuestionIcon,
            title: 'Une question ?',
            text: 'Consultez notre FAQ ou contactez notre support.',
            to: '/a-propos',
            linkLabel: 'Contactez-nous',
          },
          {
            icon: LockIcon,
            title: 'Paiement sécurisé',
            text: 'Votre paiement a été traité de manière 100% sécurisée.',
          },
        ].map(({ icon: Icon, title, text, to, linkLabel }) => (
          <div key={title} className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">{title}</p>
              <p className="mt-0.5 text-xs text-slate-500">{text}</p>
              {to && (
                <Link
                  to={to}
                  className="mt-1 inline-block text-xs font-semibold text-brand-700 hover:underline"
                >
                  {linkLabel}
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
