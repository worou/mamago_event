/**
 * Cartographie des routes de l'API MamaGo.
 *
 * Deux versions cohabitent côté serveur : l'authentification et la
 * configuration vivent en v1, le module événementiel en v2.
 */

// --- Configuration plateforme (v1) ---
export const CONFIG_URI = '/api/v1/config'

// --- Authentification (v1) ---
export const LOGIN_URI = '/api/v1/auth/login'
export const SIGNUP_URI = '/api/v1/auth/sign-up'
export const CUSTOMER_INFO_URI = '/api/v1/customer/info'

// --- Événements (v2, public) ---
export const EVENTS_BANNER_LIST_URI = '/api/v2/events/banner/list'
export const EVENTS_CATEGORY_URI = '/api/v2/events/category'
export const EVENTS_LIST_URI = '/api/v2/events/list'
export const TODAY_EVENTS_URI = '/api/v2/events/today'
export const EVENTS_TOP_LIST_URI = '/api/v2/events/top'

/**
 * Renvoie actuellement une erreur 500 côté serveur, avec ou sans coordonnées
 * et avec ou sans en-têtes zoneId/moduleId. La section « près de chez vous »
 * reste masquée tant que ce n'est pas corrigé côté backend.
 */
export const EVENTS_NEAR_LIST_URI = '/api/v2/events/nearme'

// --- Billetterie (v2, authentifié) ---
export const BOOK_TICKET_URI = '/api/v2/customer/events/ticket/book'
export const MY_TICKETS_URI = '/api/v2/customer/events/ticket/list'

/**
 * Page de paiement hébergée par le backend. Les clés secrètes Stripe ne
 * transitant jamais par le navigateur, le tunnel redirige vers cette page
 * puis revient sur l'application.
 */
export const HOSTED_PAYMENT_PATH = '/payment-mobile'

/**
 * L'API ne fournit pas de route de détail par événement
 * (/api/v2/events/{id} et /api/v2/events/details/{id} renvoient 404).
 * `events/list` retournant déjà l'objet complet — description, galeries,
 * organisateurs, grille tarifaire — la fiche est hydratée depuis la liste.
 */
export const HAS_EVENT_DETAIL_ENDPOINT = false
