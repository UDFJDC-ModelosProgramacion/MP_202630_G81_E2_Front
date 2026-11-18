import { describe, expect, it } from 'vitest'
import {
    buildPayload,
    EMPTY_VALUES,
    fieldOfBackendMessage,
    initialValues,
    isRealDate,
    validateNotification,
} from './notificationFields'

const VALID = {
    message: 'Recordatorio de vacuna',
    channel: 'EMAIL',
    date: '2026-10-14',
    time: '09:30',
    content: 'Vacuna de refuerzo de Max',
}

describe('initialValues', () => {
    it('turns a notification of the back-end into form values', () => {
        expect(
            initialValues({
                message: 'Recordatorio',
                channel: 'sms',
                date: '2026-10-14T00:00:00.000+00:00',
                time: '2026-10-14T09:30:00.000+00:00',
                content: 'Texto',
            }),
        ).toEqual({
            message: 'Recordatorio',
            channel: 'SMS',
            date: '2026-10-14',
            time: '09:30',
            content: 'Texto',
        })
    })

    it('uses empty values for what the notification does not have', () => {
        expect(initialValues({})).toEqual(EMPTY_VALUES)
    })
})

describe('isRealDate', () => {
    it('accepts real days, including 29 February of a leap year', () => {
        expect(isRealDate('2026-10-14')).toBe(true)
        expect(isRealDate('2028-02-29')).toBe(true)
    })

    it('rejects days that do not exist', () => {
        expect(isRealDate('2026-02-30')).toBe(false)
        expect(isRealDate('2027-02-29')).toBe(false)
        expect(isRealDate('2026-13-01')).toBe(false)
        expect(isRealDate('2026-00-10')).toBe(false)
    })

    it('rejects text that is not yyyy-MM-dd', () => {
        expect(isRealDate('14/10/2026')).toBe(false)
        expect(isRealDate('')).toBe(false)
    })
})

describe('validateNotification', () => {
    it('accepts a complete notification', () => {
        expect(validateNotification(VALID)).toEqual({})
    })

    it('reports every required field in screen order when all are empty', () => {
        const errors = validateNotification(EMPTY_VALUES)

        expect(Object.keys(errors)).toEqual(['message', 'channel', 'date', 'time', 'content'])
        expect(errors.message).toBe('Escribe el mensaje.')
        expect(errors.channel).toBe('Selecciona un canal.')
        expect(errors.date).toBe('Selecciona la fecha.')
        expect(errors.time).toBe('Selecciona la hora.')
        expect(errors.content).toBe('Escribe el contenido.')
    })

    it('treats a message or content made only of spaces as empty', () => {
        const errors = validateNotification({ ...VALID, message: '   ', content: ' ' })

        expect(Object.keys(errors)).toEqual(['message', 'content'])
    })

    it('accepts the three channels and rejects any other', () => {
        expect(validateNotification({ ...VALID, channel: 'SMS' })).toEqual({})
        expect(validateNotification({ ...VALID, channel: 'PUSH' })).toEqual({})
        expect(validateNotification({ ...VALID, channel: 'FAX' })).toEqual({
            channel: 'Selecciona uno de los canales disponibles.',
        })
    })

    it('rejects a date that is not real', () => {
        expect(validateNotification({ ...VALID, date: '2026-02-30' })).toEqual({
            date: 'Ingresa una fecha válida.',
        })
    })

    it('accepts the limits of the day and rejects invalid hours', () => {
        expect(validateNotification({ ...VALID, time: '00:00' })).toEqual({})
        expect(validateNotification({ ...VALID, time: '23:59' })).toEqual({})
        expect(validateNotification({ ...VALID, time: '24:00' })).toEqual({
            time: 'Ingresa una hora válida (hh:mm).',
        })
        expect(validateNotification({ ...VALID, time: '09:60' })).toEqual({
            time: 'Ingresa una hora válida (hh:mm).',
        })
        expect(validateNotification({ ...VALID, time: '9:30' })).toEqual({
            time: 'Ingresa una hora válida (hh:mm).',
        })
    })
})

describe('buildPayload', () => {
    it('trims the texts and joins the day and the hour in "time"', () => {
        expect(buildPayload({ ...VALID, message: '  Hola ', content: ' Texto  ' })).toEqual({
            message: 'Hola',
            channel: 'EMAIL',
            date: '2026-10-14',
            time: '2026-10-14T09:30:00.000Z',
            content: 'Texto',
        })
    })
})

describe('fieldOfBackendMessage', () => {
    it('maps every back-end message about a field to that field', () => {
        expect(fieldOfBackendMessage('Notification message cannot be null or empty')).toBe('message')
        expect(fieldOfBackendMessage('Notification content cannot be null or empty')).toBe('content')
        expect(fieldOfBackendMessage('Notification date cannot be null')).toBe('date')
        expect(fieldOfBackendMessage('Notification time cannot be null')).toBe('time')
        expect(fieldOfBackendMessage('Notification channel cannot be null or empty')).toBe('channel')
        expect(fieldOfBackendMessage('Notification channel is not valid')).toBe('channel')
        expect(
            fieldOfBackendMessage('The channel cannot be modified once the notification has been sent'),
        ).toBe('channel')
    })

    it('returns null for any other message', () => {
        expect(fieldOfBackendMessage('Notification not found')).toBeNull()
        expect(fieldOfBackendMessage(undefined)).toBeNull()
    })
})