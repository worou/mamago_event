import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const BookingContext = createContext(null)

const DRAFT_KEY = 'mamago.booking'

/**
 * Le brouillon de réservation est persisté : le paiement par carte quitte
 * l'application pour la page hébergée du backend, et l'utilisateur doit
 * retrouver sa commande intacte au retour.
 */
function readDraft() {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const EMPTY = { event: null, quantities: {}, order: null, guest: null }

export function BookingProvider({ children }) {
  const [draft, setDraft] = useState(() => readDraft() ?? EMPTY)

  useEffect(() => {
    try {
      if (draft.event) sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
      else sessionStorage.removeItem(DRAFT_KEY)
    } catch {
      // Mode navigation privée : on continue sans persistance.
    }
  }, [draft])

  /** Démarre une réservation ; conserve les quantités si c'est le même événement. */
  const startBooking = useCallback((event, quantities = {}) => {
    setDraft((prev) =>
      prev.event?.id === event.id
        ? { ...prev, event, quantities: { ...prev.quantities, ...quantities } }
        : { event, quantities, order: null },
    )
  }, [])

  /**
   * Une seule catégorie de billet par commande.
   *
   * `ticket/book` ne prend qu'un `event_price_id` : une sélection mixte
   * produirait plusieurs commandes distinctes pour un seul paiement. Choisir
   * une autre catégorie remplace donc la précédente. À revoir si le contrat
   * de l'API se révèle accepter plusieurs lignes.
   */
  const setQuantity = useCallback((tierId, quantity) => {
    setDraft((prev) => ({
      ...prev,
      quantities: quantity > 0 ? { [tierId]: quantity } : {},
    }))
  }, [])

  const setOrder = useCallback((order) => {
    setDraft((prev) => ({ ...prev, order }))
  }, [])

  /**
   * Coordonnées de l'acheteur non connecté.
   *
   * La réservation n'exigeant pas de jeton, l'invité commande sans compte :
   * ses nom, prénom et email accompagnent alors la commande.
   */
  const setGuest = useCallback((guest) => {
    setDraft((prev) => ({ ...prev, guest }))
  }, [])

  const clearBooking = useCallback(() => {
    setDraft(EMPTY)
    try {
      sessionStorage.removeItem(DRAFT_KEY)
    } catch {
      // ignoré
    }
  }, [])

  const lines = useMemo(() => {
    if (!draft.event) return []
    return draft.event.tiers
      .filter((tier) => (draft.quantities[tier.id] ?? 0) > 0)
      .map((tier) => {
        const quantity = draft.quantities[tier.id]
        return { tier, quantity, total: tier.price * quantity }
      })
  }, [draft.event, draft.quantities])

  const subtotal = useMemo(
    () => lines.reduce((sum, line) => sum + line.total, 0),
    [lines],
  )

  const totalQuantity = useMemo(
    () => lines.reduce((sum, line) => sum + line.quantity, 0),
    [lines],
  )

  const value = useMemo(
    () => ({
      event: draft.event,
      quantities: draft.quantities,
      order: draft.order,
      guest: draft.guest,
      lines,
      subtotal,
      totalQuantity,
      hasSelection: totalQuantity > 0,
      startBooking,
      setQuantity,
      setOrder,
      setGuest,
      clearBooking,
    }),
    [
      draft,
      lines,
      subtotal,
      totalQuantity,
      startBooking,
      setQuantity,
      setOrder,
      setGuest,
      clearBooking,
    ],
  )

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
}

export function useBooking() {
  const ctx = useContext(BookingContext)
  if (!ctx) throw new Error('useBooking doit être utilisé dans un BookingProvider')
  return ctx
}
