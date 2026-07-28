/**
 * Formatage monétaire piloté par la configuration serveur.
 * Le symbole, sa position et le nombre de décimales viennent de /api/v1/config :
 * rien n'est codé en dur, la plateforme étant multi-pays.
 */
export function formatMoney(amount, config) {
  const value = Number(amount)
  if (!Number.isFinite(value)) return '—'

  const symbol = config?.currencySymbol ?? '€'
  const digits = config?.decimalDigits ?? 2

  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)

  return config?.currencyDirection === 'left'
    ? `${symbol}${formatted}`
    : `${formatted} ${symbol}`
}

/**
 * Comme `formatMoney`, mais affiche « Gratuit » à la place de « 0,00 € ».
 * Le catalogue contient de véritables événements gratuits.
 */
export function formatPrice(amount, config) {
  return Number(amount) === 0 ? 'Gratuit' : formatMoney(amount, config)
}
