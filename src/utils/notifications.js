const DAY = /^(\d{4}-\d{2}-\d{2})/
const TIME = /T(\d{2}):(\d{2})/


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


export function formatTime(value) {
    const time = toTimeInput(value)
    if (!time) return '—'
    const [hours, minutes] = time.split(':').map(Number)
    const suffix = hours >= 12 ? 'PM' : 'AM'
    const hour12 = hours % 12 === 0 ? 12 : hours % 12
    return `${String(hour12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${suffix}`
}

export const isSent = (notification) => notification.sent === true

export const statusLabel = (notification) => (isSent(notification) ? 'Enviada' : 'Pendiente')

export const channelLabel = (notification) =>
    notification.channel ? notification.channel.toUpperCase() : '—'

const sortKey = (notification) =>
    `${toDateInput(notification.date)}${toTimeInput(notification.time)}`


export const sortNotifications = (notifications) =>
    [...notifications].sort((a, b) => sortKey(a).localeCompare(sortKey(b)))