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

// Today as 'YYYY-MM-DD' in the user's local time. Used as the upper limit of date
// pickers ("up to today"); toISOString() would give the UTC day instead.
export function todayISO(now = new Date()) {
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

const ISO_DAY_ONLY = /^\d{4}-\d{2}-\d{2}$/

// Turns a date input value ('YYYY-MM-DD') into the start of that day in the user's time
// zone ('2026-09-10T00:00:00-05:00'). The back-end stores java.util.Date and, when it
// receives a date-only string, it shifts the day for negative offsets
// (2026-09-10 is stored as 2026-09-09). Sending the offset keeps the chosen day.
export function dayStartISO(day) {
  if (!ISO_DAY_ONLY.test(String(day))) return day
  const [year, month, date] = day.split('-').map(Number)
  const local = new Date(year, month - 1, date, 0, 0, 0, 0)
  const offset = -local.getTimezoneOffset()
  const sign = offset >= 0 ? '+' : '-'
  const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0')
  const minutes = String(Math.abs(offset) % 60).padStart(2, '0')
  return `${day}T00:00:00${sign}${hours}:${minutes}`
}