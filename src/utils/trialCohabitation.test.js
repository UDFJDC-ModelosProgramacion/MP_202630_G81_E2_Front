import { describe, expect, it } from 'vitest'
import { canViewTrialRequest, trialRequestStatusLabel } from './trialCohabitation'

describe('trialRequestStatusLabel', () => {
  it('shows each status in Spanish', () => {
    expect(trialRequestStatusLabel('PENDING')).toBe('Pendiente')
    expect(trialRequestStatusLabel('APPROVED')).toBe('Aprobada')
    expect(trialRequestStatusLabel('REJECTED')).toBe('Rechazada')
    expect(trialRequestStatusLabel('CANCELLED')).toBe('Cancelada')
  })

  it('keeps an unknown status and names a missing one', () => {
    expect(trialRequestStatusLabel('ON_HOLD')).toBe('ON_HOLD')
    expect(trialRequestStatusLabel(null)).toBe('Sin estado')
  })
})

describe('canViewTrialRequest', () => {
  const REQUEST = { adopter: { id: 2 }, pet: { id: 1, shelter: { id: 1 } } }

  it('lets the adopter see only the requests they sent', () => {
    expect(canViewTrialRequest(REQUEST, { role: 'ADOPTER', userId: 2 })).toBe(true)
    expect(canViewTrialRequest(REQUEST, { role: 'ADOPTER', userId: 3 })).toBe(false)
  })

  it('lets the shelter see only the requests for its pets', () => {
    expect(canViewTrialRequest(REQUEST, { role: 'SHELTER_ADMIN', shelterId: 1 })).toBe(true)
    expect(canViewTrialRequest(REQUEST, { role: 'SHELTER_ADMIN', shelterId: 2 })).toBe(false)
  })

  it('keeps the other roles out', () => {
    expect(canViewTrialRequest(REQUEST, { role: 'VETERINARIAN', userId: 2, shelterId: 1 })).toBe(false)
  })
})
