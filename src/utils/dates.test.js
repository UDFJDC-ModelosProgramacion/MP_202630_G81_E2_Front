import { describe, expect, it } from 'vitest'
import { dayStartISO, formatDay, todayISO } from './dates'

describe('formatDay', () => {
  it('formats a plain ISO date as a day', () => {
    expect(formatDay('2026-10-21')).toBe('21 oct 2026')
  })

  it('drops the time of an ISO timestamp', () => {
    expect(formatDay('2026-03-05T05:00:00.000+00:00')).toBe('5 mar 2026')
  })

  it('shows a dash when there is no date', () => {
    expect(formatDay(null)).toBe('—')
    expect(formatDay(undefined)).toBe('—')
    expect(formatDay('')).toBe('—')
  })

  it('returns the value untouched when it is not an ISO date', () => {
    expect(formatDay('mañana')).toBe('mañana')
  })
})

describe('todayISO', () => {
  it('formats the local day with zero padding', () => {
    expect(todayISO(new Date(2026, 2, 5, 23, 59))).toBe('2026-03-05')
  })

  it('uses the current day by default', () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('dayStartISO', () => {
  it('keeps the chosen day when the backend parses the timestamp', () => {
    expect(dayStartISO('2026-10-21')).toMatch(/^2026-10-21T00:00:00[+-]\d{2}:\d{2}$/)
  })

  it('returns the value untouched when it is not a date input value', () => {
    expect(dayStartISO('')).toBe('')
    expect(dayStartISO(null)).toBeNull()
    expect(dayStartISO('2026-10-21T05:00:00Z')).toBe('2026-10-21T05:00:00Z')
  })
})