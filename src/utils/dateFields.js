const DAY = /^(\d{4}-\d{2}-\d{2})/
const TIME = /T(\d{2}):(\d{2})/
const DATE_FORMAT = /^(\d{4})-(\d{2})-(\d{2})$/


export const toDateInput = (value) => DAY.exec(String(value ?? ''))?.[1] ?? ''


export function toTimeInput(value) {
    const match = TIME.exec(String(value ?? ''))
    return match ? `${match[1]}:${match[2]}` : ''
}


export function formatShortDate(value) {
    const day = toDateInput(value)
    if (!day) return '—'
    const [year, month, dayOfMonth] = day.split('-')
    return `${dayOfMonth}/${month}/${year}`
}


export function isRealDate(value) {
    const match = DATE_FORMAT.exec(value)
    if (!match) return false
    const [, year, month, day] = match.map(Number)
    const date = new Date(Date.UTC(year, month - 1, day))
    return (
        date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
    )
}