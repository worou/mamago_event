import { api, setToken } from './client'
import * as routes from './endpoints'
import {
  adaptBannerList,
  adaptBookedTicket,
  adaptCategoryList,
  adaptConfig,
  adaptCustomer,
  adaptEventList,
  adaptTicketList,
} from './adapters'

// --- Configuration ---

export async function fetchConfig(signal) {
  return adaptConfig(await api.get(routes.CONFIG_URI, { signal }))
}

// --- Événements ---

export async function fetchEvents(signal) {
  return adaptEventList(await api.get(routes.EVENTS_LIST_URI, { signal }))
}

export async function fetchBanners(signal) {
  return adaptBannerList(await api.get(routes.EVENTS_BANNER_LIST_URI, { signal }))
}

export async function fetchCategories(signal) {
  return adaptCategoryList(await api.get(routes.EVENTS_CATEGORY_URI, { signal }))
}

export async function fetchTodayEvents(signal) {
  return adaptEventList(await api.get(routes.TODAY_EVENTS_URI, { signal }))
}

export async function fetchTopEvents(signal) {
  return adaptEventList(await api.get(routes.EVENTS_TOP_LIST_URI, { signal }))
}

/**
 * `events/list` renvoie l'objet complet et ignore les paramètres de requête
 * (limit, offset, category_id sont sans effet côté serveur). La fiche d'un
 * événement se résout donc depuis la liste, et le filtrage se fait côté client.
 */
export async function fetchEventById(id, signal) {
  const events = await fetchEvents(signal)
  return events.find((e) => String(e.id) === String(id)) ?? null
}

// --- Authentification ---

/** `field_type` indique au backend si l'identifiant est un email ou un téléphone. */
export async function login({ identifier, password }) {
  const isEmail = identifier.includes('@')

  const payload = await api.post(routes.LOGIN_URI, {
    login_type: 'manual',
    field_type: isEmail ? 'email' : 'phone',
    email_or_phone: identifier.trim(),
    password,
  })

  const token = payload?.token ?? payload?.access_token
  if (token) setToken(token)

  return { token, isPhoneVerified: payload?.is_phone_verified ?? true, raw: payload }
}

export async function register({ name, phone, email, password }) {
  const body = { name: name.trim(), phone: phone.trim(), password }
  if (email?.trim()) body.email = email.trim()

  const payload = await api.post(routes.SIGNUP_URI, body)

  const token = payload?.token ?? payload?.access_token
  if (token) setToken(token)

  return { token, raw: payload }
}

export async function fetchCustomerInfo(signal) {
  return adaptCustomer(
    await api.get(routes.CUSTOMER_INFO_URI, { auth: true, signal }),
  )
}

export function logout() {
  setToken(null)
}

// --- Billetterie ---

/**
 * Enregistre la réservation, **une fois le paiement réussi**.
 *
 * `transactionId` est l'identifiant remis par la passerelle : c'est lui qui
 * atteste du règlement, la route ne procédant à aucun encaissement.
 *
 * Contrat vérifié sur le serveur — corps en form-urlencoded, sinon 500 :
 *
 *   event_id, ticket_type, seat, total, payment_method, transaction_id
 *
 * Réponse : `{ ticket: { id, user_id, event_id, nb_seat, total,
 * transaction_id, payment_method, status: "Booked", created_at } }`
 */
export async function bookTicket({
  eventId,
  ticketType,
  seats,
  total,
  paymentMethod,
  transactionId,
  customer,
}) {
  const body = {
    event_id: eventId,
    ticket_type: ticketType,
    seat: String(seats),
    total,
    payment_method: paymentMethod,
    transaction_id: transactionId,
  }

  // Client identifié par son compte, ou par ses coordonnées s'il commande
  // en invité. Les deux ne sont jamais transmis ensemble.
  if (customer?.userId) {
    body.user_id = customer.userId
  } else if (customer) {
    body.name = customer.lastName ?? ''
    body.prenom = customer.firstName ?? ''
    body.email = customer.email ?? ''
  }

  return adaptBookedTicket(await api.postForm(routes.BOOK_TICKET_URI, body))
}

/**
 * Demande au serveur de renvoyer le billet par email.
 *
 * Le frontend ne fait que déclencher : la composition du message, le QR
 * code et l'envoi SMTP se font côté serveur.
 */
export async function resendTicketMail({ transactionId, email, name }) {
  return api.postForm(routes.RESEND_TICKET_MAIL_URI, {
    transaction_id: transactionId,
    email,
    name: name ?? '',
  })
}

export async function fetchMyTickets(signal) {
  return adaptTicketList(
    await api.get(routes.MY_TICKETS_URI, { auth: true, signal }),
  )
}

/**
 * Construit l'URL de la page de paiement hébergée par le backend.
 *
 * Le paiement par carte ne peut pas être finalisé dans le navigateur seul :
 * la clé secrète Stripe reste côté serveur. La plateforme expose donc une
 * page de paiement à laquelle on transmet la commande, puis qui redirige
 * vers `callback` une fois le règlement effectué.
 */
export function buildHostedPaymentUrl({
  orderId,
  customerId,
  paymentMethod = 'stripe',
  callback,
}) {
  const params = new URLSearchParams({
    order_id: String(orderId),
    customer_id: String(customerId ?? ''),
    payment_method: paymentMethod,
  })
  if (callback) params.set('callback', callback)

  return `${api.baseUrl}${routes.HOSTED_PAYMENT_PATH}?${params.toString()}`
}
