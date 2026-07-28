import QRCode from 'qrcode'
import { formatMoney } from './money'

/**
 * Charge utile du QR code. Si le backend fournit la sienne on l'utilise telle
 * quelle ; sinon on encode la référence de commande, qui identifie le billet
 * de façon unique et permet son contrôle à l'entrée.
 */
export function buildQrPayload(ticket) {
  if (ticket.qrPayload) return String(ticket.qrPayload)
  return JSON.stringify({
    ref: ticket.reference,
    event: ticket.eventId,
    qty: ticket.quantity,
  })
}

export async function generateQrDataUrl(payload, size = 512) {
  return QRCode.toDataURL(payload, {
    width: size,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: '#0b0b12', light: '#ffffff' },
  })
}

/**
 * Génère le billet PDF côté client.
 *
 * Si l'API expose un jour une URL de PDF officielle (`pdfUrl`), l'appelant
 * doit la privilégier : ce rendu local est le repli.
 */
export async function downloadTicketPdf({ ticket, event, config }) {
  // jsPDF et ses dépendances pèsent ~390 kB : chargés à la demande plutôt
  // qu'au démarrage, puisque seul le clic sur « Télécharger » les utilise.
  const { jsPDF } = await import('jspdf')

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 18

  const brand = [79, 70, 229]
  const ink = [15, 23, 42]
  const muted = [100, 116, 139]

  // Bandeau de titre
  doc.setFillColor(...brand)
  doc.rect(0, 0, pageWidth, 42, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.text(config?.businessName ?? 'MamaGo', margin, 20)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text('Votre billet électronique', margin, 30)

  let y = 60

  doc.setTextColor(...ink)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  // splitTextToSize évite le débordement des titres longs.
  const titleLines = doc.splitTextToSize(
    event?.title ?? ticket.eventTitle ?? 'Événement',
    pageWidth - margin * 2 - 60,
  )
  doc.text(titleLines, margin, y)
  y += titleLines.length * 8 + 4

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(...muted)

  const rows = [
    ['N° de commande', String(ticket.reference || '—')],
    ['Type de billet', ticket.type || 'Standard'],
    ['Quantité', String(ticket.quantity)],
    ['Date', event?.dateLabel || '—'],
    ['Horaire', event?.timeLabel || '—'],
    ['Lieu', event?.location || '—'],
  ]

  if (ticket.totalPrice > 0) {
    rows.push(['Total payé', formatMoney(ticket.totalPrice, config)])
  }

  for (const [label, value] of rows) {
    doc.setTextColor(...muted)
    doc.text(label, margin, y)
    doc.setTextColor(...ink)
    doc.setFont('helvetica', 'bold')
    doc.text(doc.splitTextToSize(value, 90), margin + 45, y)
    doc.setFont('helvetica', 'normal')
    y += 9
  }

  // QR code, aligné en haut à droite du bloc d'informations
  try {
    const qr = await generateQrDataUrl(buildQrPayload(ticket))
    doc.addImage(qr, 'PNG', pageWidth - margin - 55, 55, 55, 55)
    doc.setFontSize(9)
    doc.setTextColor(...muted)
    doc.text("À présenter à l'entrée", pageWidth - margin - 55, 116)
  } catch {
    // Un QR manquant ne doit pas empêcher le téléchargement du billet.
  }

  y = Math.max(y, 128)

  doc.setDrawColor(226, 232, 240)
  doc.line(margin, y, pageWidth - margin, y)
  y += 10

  doc.setFontSize(10)
  doc.setTextColor(...muted)
  const notice = doc.splitTextToSize(
    "Ce billet est unique et non transférable. Toute reproduction peut être refusée à l'entrée. " +
      "Présentez ce QR code, imprimé ou depuis votre téléphone, le jour de l'événement.",
    pageWidth - margin * 2,
  )
  doc.text(notice, margin, y)

  const safeRef = String(ticket.reference || 'billet').replace(/[^a-zA-Z0-9_-]/g, '')
  doc.save(`billet-${safeRef}.pdf`)
}
