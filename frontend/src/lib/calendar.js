const MONTHS = {
  janvier: 0, février: 1, fevrier: 1, mars: 2, avril: 3, mai: 4, juin: 5,
  juillet: 6, août: 7, aout: 7, septembre: 8, octobre: 9, novembre: 10,
  décembre: 11, decembre: 11,
}

/**
 * L'API renvoie la date déjà formatée en français ("30 avril 2026") et non en
 * ISO. On la reconstruit pour les liens calendrier ; `null` si le format
 * diffère, auquel cas l'appelant masque simplement la fonctionnalité.
 */
export function parseFrenchDate(dateLabel, timeLabel = '') {
  if (!dateLabel) return null

  const match = dateLabel
    .toLowerCase()
    .match(/(\d{1,2})\s+([a-zéûôà]+)\s+(\d{4})/i)
  if (!match) return null

  const [, day, monthName, year] = match
  const month = MONTHS[monthName]
  if (month === undefined) return null

  const [hours = 0, minutes = 0] = (timeLabel.match(/(\d{1,2})[h:](\d{2})?/) ?? [])
    .slice(1)
    .map((v) => Number(v) || 0)

  const start = new Date(Number(year), month, Number(day), hours, minutes)
  return Number.isNaN(start.getTime()) ? null : start
}

function toIcsStamp(date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

/** Liens calendrier ; `null` si la date n'a pas pu être interprétée. */
export function buildCalendarLinks(event) {
  const start = parseFrenchDate(event.dateLabel, event.startTime || event.timeLabel)
  if (!start) return null

  // Durée par défaut de 3 h, l'API ne fournissant pas d'heure de fin fiable.
  const end = new Date(start.getTime() + 3 * 60 * 60 * 1000)

  const title = encodeURIComponent(event.title)
  const details = encodeURIComponent(event.subtitle || event.description || '')
  const location = encodeURIComponent(event.location || '')
  const dates = `${toIcsStamp(start)}/${toIcsStamp(end)}`

  return {
    google: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`,
    outlook: `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&startdt=${start.toISOString()}&enddt=${end.toISOString()}&body=${details}&location=${location}`,
    ics: buildIcsDataUrl({ event, start, end }),
  }
}

/** Fichier .ics encodé en data URL — utilisé pour Apple Calendar. */
function buildIcsDataUrl({ event, start, end }) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MamaGo//Billetterie//FR',
    'BEGIN:VEVENT',
    `UID:${event.id}@mamago`,
    `DTSTAMP:${toIcsStamp(new Date())}`,
    `DTSTART:${toIcsStamp(start)}`,
    `DTEND:${toIcsStamp(end)}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    `DESCRIPTION:${escapeIcs(event.subtitle || '')}`,
    `LOCATION:${escapeIcs(event.location || '')}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]

  return `data:text/calendar;charset=utf-8,${encodeURIComponent(lines.join('\r\n'))}`
}

function escapeIcs(value) {
  return String(value).replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n')
}
