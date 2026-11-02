const ISO_DAY = /^(\d{4}-\d{2}-\d{2})/

const pad = (value) => String(value).padStart(2, '0')

// Local calendar day of "today" as YYYY-MM-DD.
export function todayISO(now = new Date()) {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

// Extracts the YYYY-MM-DD part of an ISO date or datetime.
export function dayOf(value) {
  if (!value) return ''
  const match = ISO_DAY.exec(String(value))
  return match ? match[1] : ''
}

export function isPastDay(value, today = todayISO()) {
  const day = dayOf(value)
  return day !== '' && day < today
}

export function isFutureDay(value, today = todayISO()) {
  const day = dayOf(value)
  return day !== '' && day > today
}

// The backend rejects dates earlier than "now", including today's midnight, so the
// chosen calendar day is sent at the end of the day (stored as DATE, so only the day
// is kept).
export function toEndOfDay(value) {
  const day = dayOf(value)
  return day === '' ? '' : `${day}T23:59:59`
}

export function sortByDateDesc(followUps) {
  const idOf = (followUp) => Number(followUp.id ?? 0)
  return [...followUps].sort(
    (a, b) => dayOf(b.date).localeCompare(dayOf(a.date)) || idOf(b) - idOf(a),
  )
}
