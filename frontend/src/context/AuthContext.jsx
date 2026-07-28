import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getToken, setToken } from '../api/client'
import * as services from '../api/services'

const AuthContext = createContext(null)

const PROFILE_KEY = 'mamago.profile'

/**
 * Le profil est mis en cache localement : /api/v1/customer/info n'accepte que
 * GET et peut ne pas être disponible sur toutes les installations, on ne veut
 * donc pas que l'affichage du nom dépende d'un appel réseau supplémentaire.
 */
function readCachedProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeCachedProfile(profile) {
  if (profile) localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
  else localStorage.removeItem(PROFILE_KEY)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readCachedProfile)
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getToken()))

  const applyProfile = useCallback((profile) => {
    setUser(profile)
    writeCachedProfile(profile)
  }, [])

  const signOut = useCallback(() => {
    services.logout()
    setToken(null)
    writeCachedProfile(null)
    setUser(null)
    setIsAuthenticated(false)
  }, [])

  const signIn = useCallback(
    async ({ identifier, password }) => {
      const result = await services.login({ identifier, password })
      if (!result.token) {
        throw new Error("La connexion n'a pas retourné de jeton d'accès.")
      }
      setIsAuthenticated(true)

      // Le profil complet est optionnel : un échec ici ne doit pas
      // invalider une connexion par ailleurs réussie.
      try {
        applyProfile(await services.fetchCustomerInfo())
      } catch {
        applyProfile({ name: identifier, email: identifier })
      }

      return result
    },
    [applyProfile],
  )

  const signUp = useCallback(
    async (form) => {
      const result = await services.register(form)

      // Certaines installations exigent une vérification du téléphone avant
      // de délivrer un jeton : dans ce cas on renvoie la main à l'appelant.
      if (result.token) {
        setIsAuthenticated(true)
        applyProfile({
          name: form.name,
          email: form.email ?? '',
          phone: form.phone,
        })
      }

      return result
    },
    [applyProfile],
  )

  // Un jeton révoqué côté serveur doit déconnecter l'interface.
  useEffect(() => {
    if (!isAuthenticated) return
    const controller = new AbortController()

    services
      .fetchCustomerInfo(controller.signal)
      .then(applyProfile)
      .catch((err) => {
        if (err.name === 'AbortError') return
        if (err.status === 401) signOut()
      })

    return () => controller.abort()
    // Vérification unique au montage d'une session authentifiée.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const value = useMemo(
    () => ({ user, isAuthenticated, signIn, signUp, signOut }),
    [user, isAuthenticated, signIn, signUp, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans un AuthProvider')
  return ctx
}
