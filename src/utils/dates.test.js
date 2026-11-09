import { describe, expect, it } from 'vitest'
import { dayStartISO, durationInDays, formatDay, sortByDateDescending, todayISO } from './dates'

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
describe('sortByDateDescending', () => {
  it('puts the newest record first without changing the received array', () => {
    const records = [
      { id: 1, date: '2026-01-09' },
      { id: 2, date: '2026-09-12T05:00:00.000+00:00' },
      { id: 3, date: '2026-09-10' },
    ]

    const sorted = sortByDateDescending(records)

    expect(sorted.map((record) => record.id)).toEqual([2, 3, 1])
    expect(records[0].id).toBe(1)
  })
})

describe('durationInDays', () => {
  it('counts both ends of the period', () => {
    expect(durationInDays('2026-11-10', '2026-11-20')).toBe(11)
    expect(durationInDays('2026-11-10', '2026-11-10')).toBe(1)
  })

  it('counts across a month and a leap day', () => {
    expect(durationInDays('2028-02-28', '2028-03-01')).toBe(3)
  })

  it('has no duration while the period is incomplete or inverted', () => {
    expect(durationInDays('', '2026-11-20')).toBeNull()
    expect(durationInDays('2026-11-10', '')).toBeNull()
    expect(durationInDays('2026-11-20', '2026-11-10')).toBeNull()
  })
})
