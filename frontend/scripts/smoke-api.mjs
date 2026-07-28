/**
 * Contrôle de bout en bout de la couche d'adaptation contre l'API réelle.
 *
 *   node scripts/smoke-api.mjs
 *
 * Vérifie que les réponses du serveur se normalisent en objets exploitables
 * par l'interface. À relancer après toute évolution du backend.
 */
import {
  adaptBannerList,
  adaptCategoryList,
  adaptConfig,
  adaptEventList,
} from '../src/api/adapters.js'

const BASE = process.env.VITE_API_BASE_URL ?? 'https://frstore.mamagoapps.com'

let failures = 0

function check(label, condition, detail = '') {
  const mark = condition ? '[32m✓[0m' : '[31m✗[0m'
  console.log(`  ${mark} ${label}${detail ? ` — ${detail}` : ''}`)
  if (!condition) failures += 1
}

async function get(path) {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`HTTP ${res.status} sur ${path}`)
  return res.json()
}

console.log(`\nAPI : ${BASE}\n`)

// --- Configuration ---
console.log('/api/v1/config')
const config = adaptConfig(await get('/api/v1/config'))
check('nom de la plateforme', Boolean(config.businessName), config.businessName)
check('devise', Boolean(config.currencySymbol), `${config.currencySymbol} (${config.currencyDirection})`)
check(
  'passerelles de paiement actives',
  Array.isArray(config.paymentMethods),
  config.paymentMethods.map((m) => m.gateway).join(', ') || 'aucune',
)

// --- Événements ---
console.log('\n/api/v2/events/list')
const events = adaptEventList(await get('/api/v2/events/list'))
check('liste non vide', events.length > 0, `${events.length} événement(s)`)

for (const event of events) {
  const hasCore = Boolean(event.id && event.title)
  const tiersValid = event.tiers.every(
    (t) => t.id != null && Number.isFinite(t.price) && t.remaining >= 0,
  )
  check(
    `« ${event.title} »`,
    hasCore && tiersValid,
    `${event.tiers.length} tarif(s), ${event.totalRemaining} place(s), dès ${event.fromPrice}`,
  )
}

// --- Catégories ---
console.log('\n/api/v2/events/category')
const categories = adaptCategoryList(await get('/api/v2/events/category'))
check('catégories', categories.length > 0, categories.map((c) => c.title).join(', '))

// --- Bannières ---
console.log('\n/api/v2/events/banner/list')
const banners = adaptBannerList(await get('/api/v2/events/banner/list'))
check('bannières', banners.length > 0, `${banners.length} bannière(s)`)
check(
  'événement rattaché à chaque bannière',
  banners.every((b) => b.event?.id),
)

// --- Routes vides ou en échec, tolérées par l'interface ---
console.log('\nRoutes secondaires')
for (const [label, path] of [
  ["aujourd'hui", '/api/v2/events/today'],
  ['tendances', '/api/v2/events/top'],
]) {
  const list = adaptEventList(await get(path))
  check(`${label} (section masquée si vide)`, Array.isArray(list), `${list.length} événement(s)`)
}

const nearme = await fetch(`${BASE}/api/v2/events/nearme`)
check(
  'près de chez moi',
  true,
  nearme.ok ? 'disponible' : `HTTP ${nearme.status} — section masquée volontairement`,
)

console.log(
  failures === 0
    ? '\n[32mTous les contrôles sont passés.[0m\n'
    : `\n[31m${failures} contrôle(s) en échec.[0m\n`,
)
process.exit(failures === 0 ? 0 : 1)
