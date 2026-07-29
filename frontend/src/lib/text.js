/**
 * Nettoie les descriptions issues du back-office.
 *
 * Les emoji y perdent leur encodage et laissent un « ? » isolé en tête de
 * ligne (« ? Date : … », « ? Entrée : 15 € »). Le motif est restreint au
 * début de ligne : en français, une phrase ne commence jamais par un point
 * d'interrogation, la substitution ne peut donc pas manger de ponctuation
 * légitime.
 */
export function cleanDescription(text) {
  if (!text) return ''

  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*\?\s+/, ''))
    .join('\n')
    .trim()
}
