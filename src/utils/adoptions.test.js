import { describe, expect, it } from 'vitest'
import { adoptionStatusLabel, hasActiveAdoption } from './adoptions'

describe('adoptionStatusLabel', () => {
  it('shows each status in Spanish', () => {
    expect(adoptionStatusLabel('IN_PROGRESS')).toBe('En curso')
    expect(adoptionStatusLabel('FINALIZED')).toBe('Finalizada')
    expect(adoptionStatusLabel('CANCELLED')).toBe('Cancelada')
  })

  it('keeps an unknown status and names a missing one', () => {
    expect(adoptionStatusLabel('ON_HOLD')).toBe('ON_HOLD')
    expect(adoptionStatusLabel(null)).toBe('Sin estado')
  })
})

describe('hasActiveAdoption', () => {
  it('is false for a pet without adoptions or with only cancelled ones', () => {
    expect(hasActiveAdoption({ adoptions: [] })).toBe(false)
    expect(hasActiveAdoption({})).toBe(false)
    expect(hasActiveAdoption({ adoptions: [{ status: 'CANCELLED' }] })).toBe(false)
  })

  it('is true while an adoption is in progress or finalized', () => {
    expect(hasActiveAdoption({ adoptions: [{ status: 'IN_PROGRESS' }] })).toBe(true)
    expect(hasActiveAdoption({ adoptions: [{ status: 'FINALIZED' }] })).toBe(true)
  })
})
