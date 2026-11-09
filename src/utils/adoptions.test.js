import { describe, expect, it } from 'vitest'
import {
  adoptionStatusLabel,
  canEditAdoption,
  canViewAdoption,
  hasActiveAdoption,
  isClosedAdoption,
} from './adoptions'

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

describe('isClosedAdoption', () => {
  it('is true for a finalized or cancelled adoption only', () => {
    expect(isClosedAdoption({ status: 'FINALIZED' })).toBe(true)
    expect(isClosedAdoption({ status: 'CANCELLED' })).toBe(true)
    expect(isClosedAdoption({ status: 'IN_PROGRESS' })).toBe(false)
  })
})

describe('canEditAdoption', () => {
  const IN_PROGRESS = { status: 'IN_PROGRESS', pet: { shelter: { id: 1 } } }

  it('lets the shelter that owns the pet edit an adoption in progress', () => {
    expect(canEditAdoption(IN_PROGRESS, { role: 'SHELTER_ADMIN', shelterId: 1 })).toBe(true)
  })

  it('keeps the adopter, another shelter, and closed adoptions out', () => {
    expect(canEditAdoption(IN_PROGRESS, { role: 'ADOPTER', userId: 2 })).toBe(false)
    expect(canEditAdoption(IN_PROGRESS, { role: 'SHELTER_ADMIN', shelterId: 2 })).toBe(false)
    expect(
      canEditAdoption({ ...IN_PROGRESS, status: 'FINALIZED' }, { role: 'SHELTER_ADMIN', shelterId: 1 }),
    ).toBe(false)
  })
})

describe('canViewAdoption', () => {
  const ADOPTION = { adopter: { id: 2 }, pet: { id: 1, shelter: { id: 1 } } }

  it('lets the adopter who takes part in the adoption see it', () => {
    expect(canViewAdoption(ADOPTION, { role: 'ADOPTER', userId: 2 })).toBe(true)
    expect(canViewAdoption(ADOPTION, { role: 'ADOPTER', userId: 3 })).toBe(false)
  })

  it('lets the shelter that owns the pet see the adoption', () => {
    expect(canViewAdoption(ADOPTION, { role: 'SHELTER_ADMIN', shelterId: 1 })).toBe(true)
    expect(canViewAdoption(ADOPTION, { role: 'SHELTER_ADMIN', shelterId: 2 })).toBe(false)
  })

  it('keeps the other roles out', () => {
    expect(canViewAdoption(ADOPTION, { role: 'VETERINARIAN', userId: 2, shelterId: 1 })).toBe(false)
  })
})
