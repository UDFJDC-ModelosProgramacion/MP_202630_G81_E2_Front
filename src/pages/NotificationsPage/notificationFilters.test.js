import { describe, expect, it } from 'vitest'
import { hasFilters, NO_FILTERS, RANGE_ERROR, validateRange } from './notificationFilters'

describe('validateRange', () => {
    it('accepts no dates, one date, equal dates and a normal range', () => {
        expect(validateRange(NO_FILTERS)).toBe('')
        expect(validateRange({ startDate: '2026-10-01', endDate: '' })).toBe('')
        expect(validateRange({ startDate: '', endDate: '2026-10-31' })).toBe('')
        expect(validateRange({ startDate: '2026-10-05', endDate: '2026-10-05' })).toBe('')
        expect(validateRange({ startDate: '2026-10-01', endDate: '2026-10-31' })).toBe('')
    })

    it('rejects a start after the end', () => {
        expect(validateRange({ startDate: '2026-11-01', endDate: '2026-10-31' })).toBe(RANGE_ERROR)
    })
})

describe('hasFilters', () => {
    it('is true when any date is set', () => {
        expect(hasFilters(NO_FILTERS)).toBe(false)
        expect(hasFilters({ startDate: '2026-10-01', endDate: '' })).toBe(true)
        expect(hasFilters({ startDate: '', endDate: '2026-10-31' })).toBe(true)
    })
})