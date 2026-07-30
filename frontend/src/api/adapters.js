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
 * Répare les URL de médias renvoyées par l'API.
 *
 * Trois défauts constatés sur les données réelles :
 *
 * 1. Le préfixe `/public/storage/…` renvoie 404 pour certains dossiers
 *    (catégories notamment), alors que `/storage/app/public/…` répond 200.
 *    C'est aussi le préfixe qu'emploie `/api/v1/config` pour le logo.
 *
 * 2. Certaines valeurs concatènent le préfixe et une URL absolue :
 *      …/public/storage/event/https://frstore.mamagoapps.com/storage/…webp
 *    Le résultat est en 404, tandis que l'URL imbriquée seule répond 200.
 *    Cela concerne les organisateurs, les artistes et l'image de salle,
 *    y compris quand l'URL imbriquée pointe vers un domaine externe.
 *
 * 3. D'autres ne contiennent que le répertoire, sans nom de fichier
 *    (`…/public/storage/event`), et répondent 403.
 *
 * À alléger si le backend finit par renvoyer des URL correctes.
 */
function resolveMediaUrl(url) {
  if (!url || typeof url !== 'string') return null

  let value = url.trim()
  if (!value) return null

  // Défaut 2 : ne conserver que la dernière URL absolue de la chaîne.
  const lastProtocol = Math.max(value.lastIndexOf('http://'), value.lastIndexOf('https://'))
  if (lastProtocol > 0) value = value.slice(lastProtocol)

  // Défaut 3 : sans extension sur le dernier segment, ce n'est pas un fichier.
  const lastSegment = value.split('?')[0].split('/').pop() ?? ''
  if (!/\.[a-z0-9]{2,5}$/i.test(lastSegment)) return null

  // Défaut 1 : préfixe de stockage.
  return value.replace('/public/storage/', '/storage/app/public/')
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

/**
 * Salle de l'événement.
 *
 * `party_halls` arrive sous forme de **chaîne JSON**, pas d'objet, et c'est
 * là que se trouvent les vraies coordonnées : les champs `latitude` et
 * `longitude` de l'événement sont des chaînes vides sur les entrées
 * récentes. Sans cette lecture, la carte resterait masquée alors que la
 * position est connue.
 */
export function adaptVenue(raw) {
  if (!raw) return null

  let data = raw
  if (typeof raw === 'string') {
    try {
      data = JSON.parse(raw)
    } catch {
      return null
    }
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) return null

  const latitude = Number(data.latitude)
  const longitude = Number(data.longitude)

  const venue = {
    title: data.title ?? '',
    address: data.address ?? '',
    image: resolveMediaUrl(data.image),
    latitude: Number.isFinite(latitude) && latitude !== 0 ? latitude : null,
    longitude: Number.isFinite(longitude) && longitude !== 0 ? longitude : null,
  }

  return venue.title || venue.address || venue.latitude != null ? venue : null
}

/**
 * Artistes à l'affiche.
 *
 * `participants` ne désigne pas le public mais la programmation : chaque
 * entrée porte un nom, un rôle (`works`) et une biographie.
 */
export function adaptPerformer(raw) {
  if (!raw?.name) return null
  return {
    name: raw.name,
    role: raw.works ?? '',
    bio: raw.bio ?? '',
    image: resolveMediaUrl(raw.image),
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

  const venue = adaptVenue(raw.party_halls)

  // Le tableau `organizer` mêle organisateurs et sponsors, sans ordre
  // garanti : sur l'événement 14, le sponsor arrive en premier.
  const mainOrganizer =
    organizers.find((o) => o.role === 'Organisateur') ?? organizers[0] ?? null

  const performers = (Array.isArray(raw.participants) ? raw.participants : [])
    .map(adaptPerformer)
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
    location: raw.location || venue?.address || '',
    // Les entrées récentes laissent latitude/longitude vides et ne
    // renseignent la position que dans party_halls.
    latitude: Number(raw.latitude) || venue?.latitude || null,
    longitude: Number(raw.longitude) || venue?.longitude || null,
    venue,
    // L'API renvoie une date déjà formatée en français ("30 avril 2026"),
    // pas une date ISO : on l'affiche telle quelle.
    dateLabel: raw.date ?? '',
    startTime: raw.start_time ?? '',
    timeLabel: raw.time ?? '',
    style: raw.style ?? '',
    fromPrice,
    tiers,
    organizers,
    mainOrganizer,
    isFeatured: Boolean(raw.is_featured),
    performers,
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

  const seats = (Array.isArray(raw.seats) ? raw.seats : [])
    .map(adaptSeat)
    .filter(Boolean)

  return {
    id: raw.id ?? raw.ticket_id ?? null,
    reference: raw.order_id ?? raw.reference ?? raw.transaction_id ?? raw.id ?? '',
    eventId: raw.event_id ?? event?.id ?? null,
    event,
    eventTitle: raw.event_title ?? event?.title ?? 'Événement',
    type: raw.type ?? raw.ticket_type ?? seats[0]?.type ?? 'Standard',
    quantity: toNumber(raw.quantity ?? raw.nb_ticket, 1),
    unitPrice: toNumber(raw.price ?? raw.unit_price),
    totalPrice: toNumber(raw.total_price ?? raw.amount ?? raw.total),
    status: raw.status ?? raw.payment_status ?? 'pending',
    createdAt: raw.created_at ?? null,
    seats,
    // Charge utile du QR fournie par le serveur, au niveau du billet ou de
    // sa première place. À défaut, `buildQrPayload` encode la référence.
    qrPayload: raw.qr_code ?? raw.qr ?? raw.ticket_code ?? seats[0]?.qrPayload ?? null,
    pdfUrl: raw.pdf_url ?? raw.ticket_pdf ?? null,
    raw,
  }
}

/**
 * Réponse de l'enregistrement d'une réservation.
 *
 * Forme observée sur le serveur :
 *   { ticket: { id, user_id, event_id, nb_seat, total, transaction_id,
 *               payment_method, status, created_at, updated_at } }
 *
 * `ticket_type` est accepté en entrée mais n'est pas renvoyé : l'appelant
 * conserve donc le libellé de son côté pour l'afficher.
 */
/**
 * Une place réservée.
 *
 * Le serveur émet **une entrée par place**, chacune avec son propre
 * `ticket_number` et son `qr_code`. Deux billets donnent donc deux QR
 * distincts : c'est cette charge utile qu'il faut encoder, et non une
 * référence reconstituée côté client.
 */
export function adaptSeat(raw) {
  if (!raw) return null

  return {
    id: raw.id ?? null,
    ticketId: raw.ticket_id ?? null,
    number: raw.ticket_number ?? '',
    holderName: raw.name ?? '',
    type: raw.ticket_type ?? 'Standard',
    seat: raw.seat ?? '',
    price: toNumber(raw.price),
    status: raw.status ?? 'Booked',
    qrPayload: raw.qr_code ?? null,
  }
}

export function adaptBookedTicket(payload) {
  const raw = payload?.ticket ?? payload
  if (!raw) return null

  const seats = (Array.isArray(raw.seats) ? raw.seats : [])
    .map(adaptSeat)
    .filter(Boolean)

  return {
    id: raw.id ?? null,
    reference: raw.transaction_id ?? String(raw.id ?? ''),
    eventId: toNumber(raw.event_id) || null,
    quantity: toNumber(raw.nb_seat, seats.length || 1),
    totalPrice: toNumber(raw.total),
    unitPrice: seats[0]?.price ?? 0,
    type: seats[0]?.type ?? 'Standard',
    paymentMethod: raw.payment_method ?? null,
    transactionId: raw.transaction_id ?? null,
    status: raw.status ?? 'Booked',
    createdAt: raw.created_at ?? null,
    seats,
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
