const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})/

// '2026-10-21' or '2026-10-21T05:00:00.000+00:00' -> '21 oct 2026'
// Dates are shown as a day, without time (CT4). Anything else is returned as is.
export function formatDay(value) {
  if (!value) return '—'
  const match = ISO_DAY.exec(String(value))
  if (!match) return String(value)
  const [, year, month, day] = match
  return `${Number(day)} ${MONTHS[Number(month) - 1]} ${year}`
}
