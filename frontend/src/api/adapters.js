/**
 * Normalisation des réponses de l'API.
 *
 * Les composants ne consomment que les formes définies ici : si le backend
 * change ses champs, seul ce fichier bouge.
 */

/** Convertit "1000", 1000, null → nombre exploitable. */
function toNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

/**
 * Corrige le préfixe des URL de médias.
 *
 * L'API v2 construit ses liens sous `/public/storage/…`, chemin qui renvoie
 * 404 sur le serveur ; les fichiers sont réellement servis depuis
 * `/storage/app/public/…` — c'est d'ailleurs le préfixe qu'utilise
 * `/api/v1/config` pour le logo. Vérifié : la même image de catégorie répond
 * 404 sur le premier chemin et 200 sur le second.
 *
 * À supprimer le jour où le backend renverra directement le bon préfixe.
 */
function resolveMediaUrl(url) {
  if (!url || typeof url !== 'string') return null
  return url.replace('/public/storage/', '/storage/app/public/')
}

/**
 * Une catégorie tarifaire (Standard, VIP, VVIP…).
 * `nb_ticket` est le quota total et `ticket_book` le nombre déjà vendu :
 * le restant est la différence, et c'est lui qui plafonne le sélecteur.
 */
export function adaptTicketTier(raw) {
  const quota = toNumber(raw.nb_ticket)
  const sold = toNumber(raw.ticket_book)
  const remaining = Math.max(quota - sold, 0)

  return {
    id: raw.id,
    eventId: raw.event_id,
    type: raw.type ?? 'Standard',
    price: toNumber(raw.price),
    info: raw.info ?? '',
    quota,
    sold,
    remaining,
    isAvailable: raw.status === 'active' && remaining > 0,
  }
}

export function adaptOrganizer(raw) {
  return {
    id: raw.id,
    name: raw.name ?? '',
    role: raw.role ?? '',
    image: resolveMediaUrl(raw.image),
    cover: resolveMediaUrl(raw.cover),
    bio: raw.bio ?? '',
    speciality: raw.speciality ?? '',
  }
}

/**
 * L'API expose aussi des fonctionnalités live et vote (is_live, live_price,
 * module_vote, candidates…). Hors périmètre billetterie : non adaptées ici.
 */
export function adaptEvent(raw) {
  if (!raw) return null

  const tiers = Array.isArray(raw.prices) ? raw.prices.map(adaptTicketTier) : []
  const organizers = Array.isArray(raw.organizer)
    ? raw.organizer.map(adaptOrganizer)
    : []

  // `galleries` peut être un tableau d'objets ou de chaînes selon les entrées.
  const gallery = (Array.isArray(raw.galleries) ? raw.galleries : [])
    .map((g) => (typeof g === 'string' ? g : (g?.image ?? g?.image_full_url)))
    .map(resolveMediaUrl)
    .filter(Boolean)

  const totalRemaining = tiers.reduce((sum, t) => sum + t.remaining, 0)

  // `price` au niveau de l'événement n'est pas toujours renseigné (certains
  // événements le laissent à 0 alors que leurs tarifs sont valorisés) :
  // le prix d'appel se déduit de la grille tarifaire.
  const tierPrices = tiers.filter((t) => t.price > 0).map((t) => t.price)
  const fromPrice = tierPrices.length
    ? Math.min(...tierPrices)
    : toNumber(raw.price)

  return {
    id: raw.id,
    title: raw.title ?? 'Événement',
    subtitle: raw.subtitle ?? '',
    description: raw.description ?? '',
    category: raw.category ?? null,
    image: resolveMediaUrl(raw.image),
    gallery,
    location: raw.location ?? '',
    latitude: raw.latitude ? Number(raw.latitude) : null,
    longitude: raw.longitude ? Number(raw.longitude) : null,
    // L'API renvoie une date déjà formatée en français ("30 avril 2026"),
    // pas une date ISO : on l'affiche telle quelle.
    dateLabel: raw.date ?? '',
    startTime: raw.start_time ?? '',
    timeLabel: raw.time ?? '',
    style: raw.style ?? '',
    fromPrice,
    tiers,
    organizers,
    isFeatured: Boolean(raw.is_featured),
    participants: Array.isArray(raw.participants) ? raw.participants.length : 0,
    totalRemaining,
    isSoldOut: tiers.length > 0 && totalRemaining === 0,
  }
}

export function adaptEventList(payload) {
  const events = Array.isArray(payload?.events) ? payload.events : []
  return events.map(adaptEvent).filter(Boolean)
}

export function adaptCategoryList(payload) {
  const categories = Array.isArray(payload?.categories) ? payload.categories : []
  return categories.map((c) => ({
    id: c.id,
    title: c.title ?? '',
    image: resolveMediaUrl(c.image),
  }))
}

/** Chaque bannière embarque l'événement complet : on le réutilise tel quel. */
export function adaptBannerList(payload) {
  const banners = Array.isArray(payload?.banners) ? payload.banners : []
  return banners
    .map((b) => ({
      title: b.title ?? '',
      subtitle: b.sub_title ?? '',
      image: resolveMediaUrl(b.image),
      event: adaptEvent(b.event),
    }))
    .filter((b) => b.image || b.event)
}

export function adaptConfig(raw) {
  const methods = Array.isArray(raw?.active_payment_method_list)
    ? raw.active_payment_method_list
    : []

  return {
    businessName: raw?.business_name ?? 'MamaGo',
    logo: raw?.logo_full_url || null,
    address: raw?.address ?? '',
    phone: raw?.phone ?? '',
    email: raw?.email ?? '',
    currencySymbol: raw?.currency_symbol ?? '€',
    currencyDirection: raw?.currency_symbol_direction ?? 'right',
    decimalDigits: toNumber(raw?.digit_after_decimal_point, 2),
    maintenanceMode: Boolean(raw?.maintenance_mode),
    socialLogin: Array.isArray(raw?.social_login) ? raw.social_login : [],
    // Le sélecteur de l'étape 2 est piloté par cette liste : activer PayPal
    // dans l'admin le fait apparaître sans toucher au frontend.
    paymentMethods: methods.map((m) => ({
      gateway: m.gateway,
      title: m.gateway_title ?? m.gateway,
      image: m.gateway_image_full_url || null,
      type: m.type_operator ?? null,
    })),
    cashOnDelivery: Boolean(raw?.cash_on_delivery),
    offlinePayment: Boolean(Number(raw?.offline_payment_status)),
    // « Frais de service » des maquettes. Désactivé sur cette installation
    // (status = 0) : la ligne ne s'affiche donc pas et n'entre pas dans le
    // total, plutôt que d'inventer le montant figurant sur la maquette.
    serviceFee: {
      isEnabled: Boolean(Number(raw?.additional_charge_status)),
      label: raw?.additional_charge_name || 'Frais de service',
      amount: toNumber(raw?.additional_charge),
    },
    appUrls: {
      android: raw?.app_url_android || null,
      ios: raw?.app_url_ios || null,
    },
  }
}

/**
 * Billets achetés. La forme exacte reste à confirmer avec un compte de test ;
 * les alias couvrent les variantes les plus probables et l'objet brut est
 * conservé sous `raw` pour ne rien perdre en attendant.
 */
export function adaptTicket(raw) {
  if (!raw) return null

  const event = raw.event ? adaptEvent(raw.event) : null

  return {
    id: raw.id ?? raw.ticket_id ?? null,
    reference: raw.order_id ?? raw.reference ?? raw.transaction_id ?? raw.id ?? '',
    eventId: raw.event_id ?? event?.id ?? null,
    event,
    eventTitle: raw.event_title ?? event?.title ?? 'Événement',
    type: raw.type ?? raw.ticket_type ?? 'Standard',
    quantity: toNumber(raw.quantity ?? raw.nb_ticket, 1),
    unitPrice: toNumber(raw.price ?? raw.unit_price),
    totalPrice: toNumber(raw.total_price ?? raw.amount ?? raw.total),
    status: raw.status ?? raw.payment_status ?? 'pending',
    createdAt: raw.created_at ?? null,
    // Charge utile du QR : si le backend n'en fournit pas, on encode la
    // référence de commande, qui identifie le billet de façon unique.
    qrPayload: raw.qr_code ?? raw.qr ?? raw.ticket_code ?? null,
    pdfUrl: raw.pdf_url ?? raw.ticket_pdf ?? null,
    raw,
  }
}

export function adaptTicketList(payload) {
  const list = Array.isArray(payload)
    ? payload
    : (payload?.tickets ?? payload?.data ?? payload?.orders ?? [])
  return (Array.isArray(list) ? list : []).map(adaptTicket).filter(Boolean)
}

export function adaptCustomer(raw) {
  if (!raw) return null
  const first = raw.f_name ?? ''
  const last = raw.l_name ?? ''
  const full = raw.name ?? `${first} ${last}`.trim()

  return {
    id: raw.id ?? null,
    name: full || 'Client',
    firstName: first,
    lastName: last,
    email: raw.email ?? '',
    phone: raw.phone ?? '',
    image: resolveMediaUrl(raw.image_full_url || raw.image),
  }
}
