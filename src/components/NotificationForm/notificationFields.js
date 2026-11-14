import { CHANNELS } from '../../constants/notificationOptions'
import { toDateInput, toTimeInput } from '../../utils/notifications'


export const REQUIRED_MESSAGES = {
    message: 'Escribe el mensaje.',
    channel: 'Selecciona un canal.',
    date: 'Selecciona la fecha.',
    time: 'Selecciona la hora.',
    content: 'Escribe el contenido.',
}

const FIELD_BY_BACKEND_MESSAGE = {
    'Notification message cannot be null or empty': 'message',
    'Notification content cannot be null or empty': 'content',
    'Notification date cannot be null': 'date',
    'Notification time cannot be null': 'time',
    'Notification channel cannot be null or empty': 'channel',
    'Notification channel is not valid': 'channel',
    'The channel cannot be modified once the notification has been sent': 'channel',
}

const DATE_FORMAT = /^(\d{4})-(\d{2})-(\d{2})$/
const TIME_FORMAT = /^([01]\d|2[0-3]):[0-5]\d$/

export const EMPTY_VALUES = { message: '', channel: '', date: '', time: '', content: '' }

export const initialValues = (notification) => ({
    message: notification.message ?? '',
    channel: (notification.channel ?? '').toUpperCase(),
    date: toDateInput(notification.date),
    time: toTimeInput(notification.time),
    content: notification.content ?? '',
})


export function isRealDate(value) {
    const match = DATE_FORMAT.exec(value)
    if (!match) return false
    const [, year, month, day] = match.map(Number)
    const date = new Date(Date.UTC(year, month - 1, day))
    return (
        date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
    )
}

export function validateNotification(values) {
    const errors = {}
    if (!values.message.trim()) errors.message = REQUIRED_MESSAGES.message

    if (!values.channel) errors.channel = REQUIRED_MESSAGES.channel
    else if (!CHANNELS.includes(values.channel)) {
        errors.channel = 'Selecciona uno de los canales disponibles.'
    }

    if (!values.date) errors.date = REQUIRED_MESSAGES.date
    else if (!isRealDate(values.date)) errors.date = 'Ingresa una fecha válida.'

    if (!values.time) errors.time = REQUIRED_MESSAGES.time
    else if (!TIME_FORMAT.test(values.time)) errors.time = 'Ingresa una hora válida (hh:mm).'

    if (!values.content.trim()) errors.content = REQUIRED_MESSAGES.content
    return errors
}


export const buildPayload = (values) => ({
    message: values.message.trim(),
    channel: values.channel,
    date: values.date,
    time: `${values.date}T${values.time}:00.000Z`,
    content: values.content.trim(),
})

export const fieldOfBackendMessage = (message) => FIELD_BY_BACKEND_MESSAGE[message] ?? null