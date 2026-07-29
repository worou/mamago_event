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
 * Ne renvoie plus d'erreur 500 depuis le 29/07/2026, mais ne filtre pas
 * encore par distance : les mêmes événements sont retournés pour des
 * coordonnées en Normandie et à Bangui. La section « près de chez vous »
 * reste donc non branchée — elle serait trompeuse — jusqu'à ce que le tri
 * géographique soit effectif côté serveur.
 */
export const EVENTS_NEAR_LIST_URI = '/api/v2/events/nearme'

// --- Billetterie (v2) ---

/**
 * Enregistrement d'une réservation depuis le web, appelé **après** le
 * succès du paiement : le corps porte l'identifiant de transaction.
 *
 * Deux particularités vérifiées sur le serveur :
 *
 * - le corps doit être envoyé en `application/x-www-form-urlencoded`.
 *   En JSON, la route répond 500 quel que soit son contenu ;
 * - elle n'exige aucun jeton, ce qui rend possible la commande en invité ;
 * - ⚠️ elle **ignore le champ `user_id`** : la valeur transmise est
 *   écartée et `1` est enregistré à la place (vérifié en envoyant 42).
 *   Aucune réservation n'est donc rattachée à un client, y compris pour
 *   un acheteur connecté. Tant que ce n'est pas corrigé côté serveur,
 *   « Mes réservations » ne peut afficher les commandes de personne.
 *   Le champ continue d'être transmis : il deviendra effectif sans
 *   modification du frontend le jour où le backend l'honorera.
 *
 * Champs attendus : event_id, ticket_type, seat, total, payment_method,
 * transaction_id.
 */
export const BOOK_TICKET_URI = '/api/v2/events/ticket/web/book'

/**
 * Création de l'intention de paiement, à ajouter côté serveur.
 *
 * Voir `backend-a-ajouter/README.md` : le contrôleur Laravel y est fourni.
 * Confirmer un paiement Stripe exige un `client_secret` produit avec la
 * clé secrète, laquelle ne peut pas vivre dans le navigateur.
 *
 * Contrat attendu (form-urlencoded, comme la réservation) :
 *   event_id, ticket_type, seat
 *   → { client_secret, transaction_id, amount, currency }
 */
export const PAYMENT_INTENT_URI = '/api/v2/events/ticket/web/payment-intent'

/** Variante authentifiée, conservée pour référence : renvoie 401 sans jeton. */
export const BOOK_TICKET_CUSTOMER_URI = '/api/v2/customer/events/ticket/book'

export const MY_TICKETS_URI = '/api/v2/customer/events/ticket/list'

/**
 * Renvoi du billet par email, à ajouter côté serveur.
 *
 * Voir `backend-a-ajouter/ENVOI-EMAIL.md`. L'envoi appartient au backend :
 * un navigateur ne peut pas dialoguer en SMTP. `/api/v1/config` indique
 * déjà `is_mail_active: true`, la configuration mail existe donc.
 *
 * Contrat attendu : transaction_id, email, name → { message }
 */
export const RESEND_TICKET_MAIL_URI = '/api/v2/events/ticket/web/resend-mail'

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
