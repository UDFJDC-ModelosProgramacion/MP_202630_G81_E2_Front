import { describe, expect, it } from 'vitest'
import {
    channelLabel,
    formatShortDate,
    formatTime,
    isSent,
    sortNotifications,
    statusLabel,
    toDateInput,
    toTimeInput,
} from './notifications'

describe('toDateInput', () => {
    it('keeps the day of an ISO date or timestamp', () => {
        expect(toDateInput('2026-10-14')).toBe('2026-10-14')
        expect(toDateInput('2026-10-14T00:00:00.000+00:00')).toBe('2026-10-14')
    })

    it('returns an empty value when there is no date', () => {
        expect(toDateInput(null)).toBe('')
        expect(toDateInput(undefined)).toBe('')
        expect(toDateInput('mañana')).toBe('')
    })
})

describe('toTimeInput', () => {
    it('keeps hours and minutes of an ISO timestamp', () => {
        expect(toTimeInput('2026-10-14T09:30:00.000+00:00')).toBe('09:30')
    })

    it('returns an empty value when there is no time', () => {
        expect(toTimeInput(null)).toBe('')
        expect(toTimeInput('2026-10-14')).toBe('')
    })
})

describe('formatShortDate', () => {
    it('shows day/month/year', () => {
        expect(formatShortDate('2026-10-11T00:00:00.000+00:00')).toBe('11/10/2026')
    })

    it('shows a dash when there is no date', () => {
        expect(formatShortDate(undefined)).toBe('—')
    })
})

describe('formatTime', () => {
    it('uses a 12 hour clock with AM and PM', () => {
        expect(formatTime('2026-10-11T08:00:00.000Z')).toBe('08:00 AM')
        expect(formatTime('2026-10-11T13:05:00.000Z')).toBe('01:05 PM')
    })

    it('handles midnight and noon', () => {
        expect(formatTime('2026-10-11T00:15:00.000Z')).toBe('12:15 AM')
        expect(formatTime('2026-10-11T12:00:00.000Z')).toBe('12:00 PM')
    })

    it('shows a dash when there is no time', () => {
        expect(formatTime(null)).toBe('—')
    })
})

describe('status and channel', () => {
    it('only a notification sent for sure is "Enviada"', () => {
        expect(isSent({ sent: true })).toBe(true)
        expect(statusLabel({ sent: true })).toBe('Enviada')
        expect(statusLabel({ sent: false })).toBe('Pendiente')
        expect(statusLabel({})).toBe('Pendiente')
    })

    it('shows the channel in capitals or a dash', () => {
        expect(channelLabel({ channel: 'sms' })).toBe('SMS')
        expect(channelLabel({ channel: null })).toBe('—')
    })
})

describe('sortNotifications', () => {
    const early = { id: 1, date: '2026-10-11', time: '2026-10-11T08:00:00.000Z' }
    const sameDayLater = { id: 2, date: '2026-10-11', time: '2026-10-11T09:30:00.000Z' }
    const later = { id: 3, date: '2026-10-14', time: '2026-10-14T07:00:00.000Z' }

    it('orders by day and then by time, oldest first', () => {
        const sorted = sortNotifications([later, sameDayLater, early])

        expect(sorted.map((n) => n.id)).toEqual([1, 2, 3])
    })

    it('does not change the received list', () => {
        const original = [later, early]

        sortNotifications(original)

        expect(original.map((n) => n.id)).toEqual([3, 1])
    })

    it('puts notifications without date first and keeps working', () => {
        expect(sortNotifications([early, { id: 9 }]).map((n) => n.id)).toEqual([9, 1])
    })
})