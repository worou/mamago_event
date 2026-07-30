import { loadStripe } from '@stripe/stripe-js'
import { api } from '../api/client'
import { PAYMENT_INTENT_URI } from '../api/endpoints'

/**
 * Instance Stripe, chargée une seule fois.
 *
 * Seule la clé **publiable** est employée : c'est son rôle, et elle ne
 * permet que de confirmer un paiement dont le serveur a déjà créé
 * l'intention. La clé secrète ne doit jamais figurer ici — Vite inline
 * toute variable `VITE_*` en clair dans le bundle.
 */
let stripePromise = null

export function getStripe() {
  const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  if (!key) return null

  stripePromise ??= loadStripe(key)
  return stripePromise
}

export function isCardPaymentConfigured() {
  return Boolean(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
}

/**
 * L'envoi du billet par email est-il opérationnel côté serveur ?
 *
 * Faux par défaut : à la date de cette écriture, `ticket/web/book`
 * n'envoie rien et aucune route d'envoi n'existe (404 sur toutes celles
 * cherchées). Annoncer un email qui n'arrive pas laisse l'acheteur
 * attendre au lieu de télécharger son billet — le seul exemplaire qu'il
 * possède, puisque `user_id` est ignoré et qu'il ne pourra pas le
 * retrouver ensuite.
 *
 * Passer `VITE_TICKET_EMAIL_ENABLED=1` une fois le Mailable branché (voir
 * `backend-a-ajouter/ENVOI-EMAIL.md`).
 */
export function isTicketEmailEnabled() {
  return import.meta.env.VITE_TICKET_EMAIL_ENABLED === '1'
}

/**
 * Mode Stripe déduit du préfixe de la clé publiable.
 *
 * Aucun réglage séparé n'est nécessaire — et donc aucun risque qu'il
 * contredise la clé réellement employée. Le repère affiché disparaît de
 * lui-même dès qu'une clé `pk_live_` est configurée.
 */
export function isStripeTestMode() {
  return String(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '').startsWith(
    'pk_test_',
  )
}

/**
 * Demande au serveur de créer l'intention de paiement.
 *
 * Le montant n'est volontairement pas transmis : c'est au serveur de le
 * recalculer depuis l'événement et le tarif. Un montant venu du client
 * permettrait de payer un billet à 15 € pour 1 €.
 */
export async function createPaymentIntent({ eventId, ticketType, seats }) {
  const payload = await api.postForm(PAYMENT_INTENT_URI, {
    event_id: eventId,
    ticket_type: ticketType,
    seat: String(seats),
  })

  const clientSecret = payload?.client_secret ?? payload?.clientSecret
  if (!clientSecret) {
    throw new Error("Le serveur n'a pas renvoyé de client_secret.")
  }

  return { clientSecret, transactionId: payload?.transaction_id ?? null }
}

/**
 * Traduit les erreurs Stripe en messages lisibles.
 * Les libellés d'origine sont en anglais et souvent techniques.
 */
export function describeStripeError(error) {
  if (!error) return null

  const byCode = {
    card_declined: 'Votre carte a été refusée. Essayez-en une autre.',
    expired_card: 'Cette carte est expirée.',
    incorrect_cvc: 'Le code de sécurité est incorrect.',
    incorrect_number: 'Le numéro de carte est incorrect.',
    insufficient_funds: 'Provision insuffisante sur cette carte.',
    processing_error:
      'Le traitement a échoué. Merci de réessayer dans un instant.',
  }

  return (
    byCode[error.decline_code] ??
    byCode[error.code] ??
    error.message ??
    "Le paiement n'a pas abouti."
  )
}
