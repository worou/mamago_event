/**
 * Bac à sable de développement.
 *
 * ────────────────────────────────────────────────────────────────────────
 * CE MODULE NE MET PAS STRIPE EN MODE TEST.
 *
 * Le mode test de Stripe se règle côté serveur, dans l'administration
 * MamaGo (Payment Methods → Stripe → Test/Live, avec ses propres clés).
 * Aucun code frontend ne peut l'activer.
 *
 * Ce bac à sable sert à autre chose : parcourir le tunnel de réservation
 * de bout en bout sans compte, sans commande réelle et sans paiement,
 * pour valider l'interface des étapes 2 à 4. Les routes authentifiées de
 * l'API renvoyant 401, elles seraient autrement impossibles à afficher.
 * ────────────────────────────────────────────────────────────────────────
 *
 * Activation : VITE_SANDBOX=1 dans .env.local — et uniquement en
 * développement. Le garde ci-dessous rend le module inopérant dans un
 * build de production : un simulateur qui confirme de faux paiements n'a
 * rien à faire en ligne.
 */

const STORAGE_KEY = 'mamago.sandbox.orders'
const OUTCOME_KEY = 'mamago.sandbox.outcome'

/**
 * Prix de démonstration — désactivés par défaut.
 *
 * Le bac à sable ne simule que ce qu'il ne peut pas faire autrement :
 * session, réservation et paiement. Les tarifs, eux, viennent du vrai
 * catalogue, afin que ce qui est affiché corresponde à la réalité.
 *
 * `VITE_SANDBOX_PRICE=99` force un tarif uniforme, utile seulement lorsque
 * le catalogue affiche des montants peu présentables. Sans cette variable,
 * aucun prix n'est touché.
 *
 * Hors bac à sable, les prix ne sont jamais modifiés : les altérer ferait
 * diverger le montant affiché du montant réellement débité.
 */
const DEMO_PRICE = import.meta.env.VITE_SANDBOX_PRICE
  ? Number(import.meta.env.VITE_SANDBOX_PRICE)
  : null

function applyDemoPrices(payload) {
  if (DEMO_PRICE === null || !Number.isFinite(DEMO_PRICE) || DEMO_PRICE <= 0) {
    return payload
  }

  const rewrite = (event) => {
    if (!event || typeof event !== 'object') return event
    return {
      ...event,
      price: event.price === 0 ? 0 : DEMO_PRICE,
      prices: Array.isArray(event.prices)
        ? event.prices.map((tier, index) => ({
            ...tier,
            // Un écart léger entre catégories pour que la grille reste lisible.
            price: Number(tier.price) === 0 ? 0 : DEMO_PRICE + index * 50,
          }))
        : event.prices,
    }
  }

  if (Array.isArray(payload?.events)) {
    return { ...payload, events: payload.events.map(rewrite) }
  }
  if (Array.isArray(payload?.banners)) {
    return {
      ...payload,
      banners: payload.banners.map((b) => ({ ...b, event: rewrite(b.event) })),
    }
  }
  return payload
}

export function isSandboxEnabled() {
  return Boolean(import.meta.env.DEV && import.meta.env.VITE_SANDBOX === '1')
}

/** Issue simulée du paiement, basculable depuis le bandeau. */
export function getOutcome() {
  return localStorage.getItem(OUTCOME_KEY) === 'failed' ? 'failed' : 'success'
}

export function setOutcome(outcome) {
  localStorage.setItem(OUTCOME_KEY, outcome === 'failed' ? 'failed' : 'success')
}

function readOrders() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeOrders(orders) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders))
}

export function resetSandbox() {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(OUTCOME_KEY)
  localStorage.removeItem('mamago.token')
  localStorage.removeItem('mamago.profile')
  sessionStorage.removeItem('mamago.booking')
}

const CUSTOMER = {
  id: 9001,
  f_name: 'Jean',
  l_name: 'Dupont',
  name: 'Jean Dupont',
  email: 'jean.dupont@sandbox.test',
  phone: '+33612345678',
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/**
 * Événement source d'une commande simulée.
 *
 * Les mêmes tarifs de démonstration que ceux affichés y sont appliqués :
 * sans cela, la commande serait valorisée au prix réel de l'API alors que
 * l'écran annonce le prix de démonstration.
 */
async function fetchRealEvent(realFetch, eventId) {
  try {
    const res = await realFetch(
      `${import.meta.env.VITE_API_BASE_URL ?? 'https://frstore.mamagoapps.com'}/api/v2/events/list`,
    )
    const payload = applyDemoPrices(await res.json())
    return (payload.events ?? []).find((e) => String(e.id) === String(eventId)) ?? null
  } catch {
    return null
  }
}

/**
 * Fixture d'un billet acheté.
 *
 * ⚠️ La forme exacte de /api/v2/customer/events/ticket/list N'A PAS ÉTÉ
 * VÉRIFIÉE : la route est authentifiée et renvoie 401 sans jeton. Les
 * champs ci-dessous reproduisent les suppositions de `adaptTicket`, donc
 * un parcours réussi dans le bac à sable NE PROUVE PAS que l'écran
 * fonctionnera avec le vrai serveur. À réviser dès qu'un compte de test
 * sera disponible.
 */
function buildOrder({ eventId, tierId, quantity, paymentMethod, rawEvent }) {
  const tier = (rawEvent?.prices ?? []).find((p) => String(p.id) === String(tierId))
  const unitPrice = Number(tier?.price ?? 0)
  const reference = `SBX-${Date.now().toString(36).toUpperCase()}`

  return {
    id: reference,
    order_id: reference,
    event_id: eventId,
    event: rawEvent,
    event_title: rawEvent?.title ?? 'Événement',
    type: tier?.type ?? 'Standard',
    quantity,
    price: unitPrice,
    total_price: unitPrice * quantity,
    status: 'paid',
    payment_method: paymentMethod,
    created_at: new Date().toISOString(),
    // Le backend ne fournit peut-être pas ces deux champs : les laisser
    // nuls fait travailler le repli (QR et PDF générés côté client).
    qr_code: null,
    pdf_url: null,
  }
}

/**
 * Remplace `window.fetch` par une version qui intercepte les seules routes
 * inaccessibles sans compte. Tout le reste — configuration, événements,
 * catégories, bannières — part vers le vrai serveur.
 */
export function installSandbox() {
  if (!isSandboxEnabled()) return false
  if (window.__mamagoSandboxInstalled) return true
  window.__mamagoSandboxInstalled = true

  const realFetch = window.fetch.bind(window)

  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : (input?.url ?? '')
    const method = (init.method ?? (typeof input === 'object' ? input.method : 'GET') ?? 'GET')
      .toUpperCase()

    const body = (() => {
      try {
        return init.body ? JSON.parse(init.body) : null
      } catch {
        return null
      }
    })()

    // --- Session simulée ---
    if (url.includes('/auth/login') || url.includes('/auth/sign-up')) {
      return json({ token: 'sandbox-token', is_phone_verified: 1 })
    }

    if (url.includes('/customer/info')) {
      return json(CUSTOMER)
    }

    // --- Réservation ---
    if (url.includes('/events/ticket/book') && method === 'POST') {
      const rawEvent = await fetchRealEvent(realFetch, body?.event_id)
      const order = buildOrder({
        eventId: body?.event_id,
        tierId: body?.event_price_id,
        quantity: Number(body?.quantity ?? 1),
        paymentMethod: body?.payment_method,
        rawEvent,
      })

      const outcome = getOutcome()
      if (outcome === 'success') {
        writeOrders([order, ...readOrders()])
      }

      // Au lieu de partir vers la page de paiement hébergée, on revient
      // dans l'application avec le statut simulé — ce qui exerce aussi la
      // restauration du brouillon après rechargement complet.
      return json({
        order_id: order.order_id,
        redirect_url: `/reservation/confirmation?status=${outcome}`,
      })
    }

    if (url.includes('/events/ticket/list')) {
      return json(readOrders())
    }

    // --- Catalogue : données réelles, tarifs de démonstration ---
    if (/\/events\/(list|today|top|banner\/list)/.test(url)) {
      const res = await realFetch(input, init)
      if (!res.ok) return res
      try {
        return json(applyDemoPrices(await res.clone().json()))
      } catch {
        return res
      }
    }

    return realFetch(input, init)
  }

  // eslint-disable-next-line no-console
  console.info(
    '%c[bac à sable] actif — session, réservation et paiement simulés. Stripe n\'est PAS en mode test.',
    'background:#0a7d4a;color:#fff;padding:2px 6px;border-radius:3px',
  )

  return true
}
