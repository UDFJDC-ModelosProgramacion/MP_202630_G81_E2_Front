import { describe, expect, it } from 'vitest'
import {
  dayOf,
  isFutureDay,
  isPastDay,
  sortByDateDesc,
  statusOfDay,
  toEndOfDay,
  todayISO,
} from './followUpDates'

describe('todayISO', () => {
  it('formats the local date as YYYY-MM-DD', () => {
    expect(todayISO(new Date(2026, 10, 1))).toBe('2026-11-01')
    expect(todayISO(new Date(2026, 0, 9))).toBe('2026-01-09')
  })
})

describe('dayOf', () => {
  it('extracts the day from ISO dates and datetimes', () => {
    expect(dayOf('2026-11-01')).toBe('2026-11-01')
    expect(dayOf('2026-11-01T23:59:59')).toBe('2026-11-01')
    expect(dayOf('2026-11-01T05:00:00.000+00:00')).toBe('2026-11-01')
  })

  it('returns an empty string for missing or invalid values', () => {
    expect(dayOf('')).toBe('')
    expect(dayOf(null)).toBe('')
    expect(dayOf('mañana')).toBe('')
  })
})

describe('isPastDay and isFutureDay', () => {
  const today = '2026-11-01'

  it('compares calendar days', () => {
    expect(isPastDay('2026-10-31', today)).toBe(true)
    expect(isPastDay('2026-11-01T23:59:59', today)).toBe(false)
    expect(isPastDay('2026-11-02', today)).toBe(false)
    expect(isFutureDay('2026-11-02', today)).toBe(true)
    expect(isFutureDay('2026-11-01T00:00:00', today)).toBe(false)
    expect(isFutureDay('2026-10-31', today)).toBe(false)
  })
})

describe('toEndOfDay', () => {
  it('sends the chosen day at the end of the day', () => {
    expect(toEndOfDay('2026-11-01')).toBe('2026-11-01T23:59:59')
    expect(toEndOfDay('2026-11-01T08:00:00')).toBe('2026-11-01T23:59:59')
    expect(toEndOfDay('')).toBe('')
  })
})

describe('statusOfDay', () => {
  it('classifies a day as past, today or future', () => {
    const today = '2026-11-01'
    expect(statusOfDay('2026-10-31', today)).toBe('past')
    expect(statusOfDay('2026-11-01T05:00:00', today)).toBe('today')
    expect(statusOfDay('2026-11-02', today)).toBe('future')
    expect(statusOfDay('', today)).toBe('')
  })
})

describe('sortByDateDesc', () => {
  it('sorts by date descending with id as tiebreaker', () => {
    const followUps = [
      { id: 1, date: '2026-10-01T00:00:00.000+00:00' },
      { id: 3, date: '2026-12-01T00:00:00.000+00:00' },
      { id: 2, date: '2026-10-01T00:00:00.000+00:00' },
    ]

    expect(sortByDateDesc(followUps).map((followUp) => followUp.id)).toEqual([3, 2, 1])
    expect(followUps.map((followUp) => followUp.id)).toEqual([1, 3, 2])
  })
})
