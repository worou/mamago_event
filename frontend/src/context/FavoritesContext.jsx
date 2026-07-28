import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const FavoritesContext = createContext(null)

const KEY = 'mamago.favorites'

/**
 * Favoris conservés localement.
 *
 * L'API n'expose aucune route de mise en favori : la persistance est donc
 * limitée au navigateur. À rebrancher sur le serveur si un endpoint apparaît.
 */
function read() {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return []
  }
}

export function FavoritesProvider({ children }) {
  const [ids, setIds] = useState(read)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(ids))
    } catch {
      // Navigation privée : on continue sans persistance.
    }
  }, [ids])

  const toggle = useCallback((eventId) => {
    const key = String(eventId)
    setIds((prev) =>
      prev.includes(key) ? prev.filter((id) => id !== key) : [...prev, key],
    )
  }, [])

  const isFavorite = useCallback((eventId) => ids.includes(String(eventId)), [ids])

  const value = useMemo(
    () => ({ ids, count: ids.length, toggle, isFavorite }),
    [ids, toggle, isFavorite],
  )

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavorites doit être utilisé dans un FavoritesProvider')
  return ctx
}
