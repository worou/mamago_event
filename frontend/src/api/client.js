const BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? 'https://frstore.mamagoapps.com'
).replace(/\/$/, '')

const TOKEN_KEY = 'mamago.token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

/** Erreur porteuse du statut HTTP et des erreurs champ par champ de l'API. */
export class ApiError extends Error {
  constructor(message, { status, fieldErrors = {}, code = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
    this.code = code
  }
}

/**
 * Le backend a deux formats d'erreur selon la version de l'API :
 *   v1 → { errors: [{ code: 'password', message: '...' }] }
 *   v2 → { message: 'Unauthenticated.' }
 * On les ramène à une forme unique pour que l'UI n'ait qu'un cas à traiter.
 */
function normalizeError(payload, status) {
  const fieldErrors = {}
  let code = null
  let message = null

  if (payload && Array.isArray(payload.errors)) {
    for (const err of payload.errors) {
      if (err?.code) fieldErrors[err.code] = err.message
    }
    code = payload.errors[0]?.code ?? null
    message = payload.errors[0]?.message ?? null
  } else if (payload?.errors && typeof payload.errors === 'object') {
    code = payload.errors.code ?? null
    message = payload.errors.message ?? null
  }

  if (!message) message = payload?.message ?? null

  if (!message) {
    message =
      status === 401
        ? 'Votre session a expiré. Merci de vous reconnecter.'
        : 'Une erreur est survenue. Merci de réessayer.'
  }

  return new ApiError(message, { status, fieldErrors, code })
}

async function request(
  path,
  { method = 'GET', body, auth = false, signal, form = false } = {},
) {
  const headers = { Accept: 'application/json' }

  // La plateforme est multi-module ; certaines routes filtrent sur ces en-têtes.
  if (import.meta.env.VITE_MODULE_ID) headers.moduleId = import.meta.env.VITE_MODULE_ID
  if (import.meta.env.VITE_ZONE_ID) headers.zoneId = import.meta.env.VITE_ZONE_ID

  // `form: true` pour les routes qui n'acceptent pas le JSON — la
  // réservation web répond 500 sur tout corps JSON, quel qu'en soit le
  // contenu, et n'aboutit qu'en form-urlencoded.
  if (body !== undefined) {
    headers['Content-Type'] = form
      ? 'application/x-www-form-urlencoded'
      : 'application/json'
  }

  if (auth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body:
        body === undefined
          ? undefined
          : form
            ? new URLSearchParams(body).toString()
            : JSON.stringify(body),
      signal,
    })
  } catch (err) {
    if (err.name === 'AbortError') throw err
    throw new ApiError(
      'Impossible de joindre le serveur. Vérifiez votre connexion.',
      { status: 0 },
    )
  }

  const raw = await response.text()
  let payload = null
  if (raw) {
    try {
      payload = JSON.parse(raw)
    } catch {
      // Une réponse non-JSON sur une route API signale une erreur serveur.
      if (!response.ok) {
        throw new ApiError('Réponse inattendue du serveur.', {
          status: response.status,
        })
      }
    }
  }

  if (!response.ok) throw normalizeError(payload, response.status)

  return payload
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  /** POST en application/x-www-form-urlencoded. */
  postForm: (path, body, opts) =>
    request(path, { ...opts, method: 'POST', body, form: true }),
  baseUrl: BASE_URL,
}
