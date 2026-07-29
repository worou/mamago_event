import { useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { bookTicket } from '../../api/services'
import { collectPayment } from '../../lib/payment'
import { useBooking } from '../../context/BookingContext'
import { useConfig } from '../../context/ConfigContext'
import { formatMoney } from '../../lib/money'
import Stepper from '../../components/checkout/Stepper'
import EventSummaryCard from '../../components/checkout/EventSummaryCard'
import PaymentMethodList from '../../components/checkout/PaymentMethodList'
import OrderTable from '../../components/checkout/OrderTable'
import { TrustStrip } from '../../components/layout/Footer'
import { Alert, Button, Field } from '../../components/ui'
import { ArrowLeftIcon, LockIcon, ShieldIcon } from '../../components/Icons'

export default function CheckoutPaymentPage() {
  const navigate = useNavigate()
  const { config } = useConfig()
  const { event, lines, subtotal, totalQuantity, hasSelection, setQuantity, setOrder } =
    useBooking()

  const [selected, setSelected] = useState(null)
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const [promoNotice, setPromoNotice] = useState(null)

  /**
   * Les passerelles en ligne viennent de la configuration serveur ; le
   * paiement sur place n'est proposé que si le backend l'autorise.
   */
  const methods = useMemo(() => {
    const list = config.paymentMethods.map((m) => ({
      id: m.gateway,
      title: m.gateway === 'stripe' ? 'Carte bancaire (Stripe)' : m.title,
      description:
        m.gateway === 'stripe'
          ? 'Visa, Mastercard, American Express — paiement instantané'
          : 'Paiement en ligne sécurisé',
      image: m.image,
      isOffline: false,
    }))

    if (config.cashOnDelivery || config.offlinePayment) {
      list.push({
        id: 'cash_on_delivery',
        title: 'Paiement sur place',
        description: "Réglez en espèces le jour de l'événement",
        image: null,
        isOffline: true,
      })
    }

    return list
  }, [config])

  const activeMethod = selected ?? methods[0]?.id ?? null
  const isOffline = methods.find((m) => m.id === activeMethod)?.isOffline

  const serviceFee = config.serviceFee.isEnabled ? config.serviceFee.amount : 0
  const total = subtotal + serviceFee

  if (!event || !hasSelection) {
    return <Navigate to="/evenements" replace />
  }

  /**
   * L'API expose bien /api/v1/coupon/apply, mais son contrat n'a pas pu être
   * vérifié (route authentifiée, non testable sans compte). On informe donc
   * plutôt que de simuler une remise.
   */
  function handlePromo(submitEvent) {
    submitEvent.preventDefault()
    if (!promoCode.trim()) return
    setPromoNotice(
      "Les codes promotionnels ne sont pas encore activés sur cette billetterie.",
    )
  }

  /**
   * Règlement puis enregistrement, dans cet ordre.
   *
   * `ticket/web/book` n'encaisse rien : elle consigne une réservation déjà
   * payée, attestée par `transaction_id`. Le paiement doit donc aboutir
   * avant l'appel, faute de quoi on enregistrerait des réservations non
   * réglées.
   */
  async function handlePay() {
    if (!activeMethod) return

    setError(null)
    setIsSubmitting(true)

    try {
      // Une seule ligne : la sélection est contrainte à une catégorie.
      const [line] = lines

      const transactionId = isOffline
        ? // Règlement sur place : rien n'est encaissé en ligne, la référence
          // sert seulement à retrouver la réservation le jour J.
          `SUR-PLACE-${Date.now().toString(36).toUpperCase()}`
        : await collectPayment({ amount: total, method: activeMethod })

      if (!transactionId) {
        setIsSubmitting(false)
        return
      }

      const ticket = await bookTicket({
        eventId: event.id,
        ticketType: line.tier.type,
        seats: line.quantity,
        total,
        paymentMethod: activeMethod,
        transactionId,
      })

      setOrder({
        id: ticket?.reference ?? transactionId,
        ticketId: ticket?.id ?? null,
        method: activeMethod,
        amount: total,
        serviceFee,
        transactionId,
        response: ticket?.raw ?? null,
        createdAt: new Date().toISOString(),
      })

      navigate('/reservation/confirmation?status=success')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Stepper current={2} />

      <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
        <EventSummaryCard event={event} showDetailLink={false} />

        <div className="card p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-slate-900">
            Paiement – Réservez votre billet
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Vérifiez vos billets et choisissez votre moyen de paiement.
          </p>

          <Alert className="mt-6">{error}</Alert>

          <div className="mt-8 grid gap-8 xl:grid-cols-2">
            {/* Colonne 1 — récapitulatif */}
            <section>
              <h2 className="mb-4 font-semibold text-brand-700">
                1. Récapitulatif de la commande
              </h2>

              <OrderTable
                lines={lines}
                onQuantityChange={setQuantity}
                serviceFee={serviceFee}
                total={total}
              />

              <form onSubmit={handlePromo} className="mt-5">
                <Field label="Code promo">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => {
                        setPromoCode(e.target.value)
                        setPromoNotice(null)
                      }}
                      placeholder="Entrez votre code"
                      className="field"
                    />
                    <Button type="submit" variant="secondary" className="shrink-0">
                      Appliquer
                    </Button>
                  </div>
                </Field>
                {promoNotice && (
                  <p className="mt-2 text-xs text-amber-700">{promoNotice}</p>
                )}
              </form>

              <div className="mt-5 flex items-start gap-3 rounded-xl bg-brand-50 p-4">
                <ShieldIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                <p className="text-sm text-slate-700">
                  <span className="font-semibold">Paiement 100% sécurisé</span>
                  <br />
                  <span className="text-slate-600">
                    Vos données sont cryptées et sécurisées.
                  </span>
                </p>
              </div>
            </section>

            {/* Colonne 2 — moyen de paiement */}
            <section>
              <h2 className="mb-4 font-semibold text-brand-700">
                2. Choisissez votre moyen de paiement
              </h2>

              <PaymentMethodList
                methods={methods}
                selected={activeMethod}
                onSelect={setSelected}
              />

              {/*
                La maquette place ici les champs carte. Ils ne peuvent pas
                être rendus : confirmer un paiement exige un client_secret créé
                côté serveur, et saisir un numéro de carte dans cette page en
                l'absence d'intégration Stripe reviendrait à exposer des
                données bancaires sans les protéger. Le bloc explique donc la
                redirection vers la page de paiement du backend.
              */}
              {activeMethod && !isOffline && (
                <div className="mt-4 rounded-xl border border-slate-200 p-5">
                  <div className="flex items-start gap-3">
                    <LockIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                    <div>
                      <p className="font-semibold text-slate-900">
                        Saisie sécurisée de votre carte
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        Après validation, vous serez redirigé vers la page de
                        paiement sécurisée pour saisir vos informations
                        bancaires. Vos coordonnées de carte ne transitent jamais
                        par ce site.
                      </p>
                    </div>
                  </div>

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
                </div>
              )}

              {isOffline && (
                <div className="mt-4 rounded-xl border border-slate-200 p-5 text-sm text-slate-600">
                  Votre réservation sera enregistrée immédiatement. Le règlement
                  s'effectuera sur place, le jour de l'événement.
                </div>
              )}
            </section>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-6">
            <Button
              variant="secondary"
              onClick={() => navigate('/reservation/informations')}
            >
              <ArrowLeftIcon className="h-4 w-4" /> Retour
            </Button>

            <div className="flex items-center gap-4">
              <p className="text-sm text-slate-500">
                {totalQuantity} billet{totalQuantity > 1 ? 's' : ''}
              </p>
              <Button
                size="lg"
                onClick={handlePay}
                isLoading={isSubmitting}
                disabled={!activeMethod}
              >
                <LockIcon className="h-5 w-5" />
                Payer {formatMoney(total, config)}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <TrustStrip />
      </div>
    </div>
  )
}
