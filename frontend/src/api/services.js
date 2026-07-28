import { api, setToken } from './client'
import * as routes from './endpoints'
import {
  adaptBannerList,
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
 * Crée la commande de billets.
 *
 * Le contrat exact du corps de requête n'a pas encore pu être confirmé :
 * la route est authentifiée et renvoie 401 sans jeton, ce qui empêche de
 * lire ses erreurs de validation. Les champs ci-dessous suivent la
 * convention des autres routes de la plateforme et sont à ajuster dès
 * qu'un compte de test est disponible.
 */
export async function bookTicket({ eventId, tierId, quantity, paymentMethod }) {
  return api.post(
    routes.BOOK_TICKET_URI,
    {
      event_id: eventId,
      event_price_id: tierId,
      quantity,
      payment_method: paymentMethod,
    },
    { auth: true },
  )
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
