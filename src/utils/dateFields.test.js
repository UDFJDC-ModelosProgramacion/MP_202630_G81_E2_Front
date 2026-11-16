import { describe, expect, it } from 'vitest'
import { formatShortDate, isRealDate, toDateInput, toTimeInput } from './dateFields'

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

describe('isRealDate', () => {
    it('accepts an existing day', () => {
        expect(isRealDate('2026-02-28')).toBe(true)
        expect(isRealDate('2028-02-29')).toBe(true)
    })

    it('rejects a wrong format', () => {
        expect(isRealDate('14/10/2026')).toBe(false)
        expect(isRealDate('')).toBe(false)
    })

    it('rejects a day that does not exist', () => {
        expect(isRealDate('2026-02-30')).toBe(false)
        expect(isRealDate('2026-13-01')).toBe(false)
    })
})